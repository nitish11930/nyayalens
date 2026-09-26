import { NextRequest, NextResponse } from 'next/server';
import { AnalysisResult } from '@/types';
import fs from 'fs';
import path from 'path';

// ─── Prompt Template ──────────────────────────────────────────────────────────
let SYSTEM_PROMPT: string;
try {
  SYSTEM_PROMPT = fs.readFileSync(
    path.join(process.cwd(), 'prompts', 'legal-notice-analysis.md'),
    'utf-8'
  );
} catch {
  SYSTEM_PROMPT = `You are NyayaLens, an Indian civic legal literacy assistant.
Analyze the provided Indian legal notice document image or PDF.

CRITICAL RULES:
- You are NOT a lawyer. Do NOT provide legal advice.
- NEVER predict legal outcomes.
- NEVER invent deadlines not explicitly stated in the document.
- NEVER fabricate facts, citations, names, or amounts.
- All documentExcerpts.text values must be VERBATIM quotes from the document.
- If a value is not determinable from the document, use "not_determinable".
- Do NOT guess. Do NOT hallucinate.

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "noticeCategory": { "type": string, "legalSection": string | null, "icon": string },
  "plainEnglishSummary": string,
  "keyFacts": [{ "label": string, "value": string, "sourcePageLine": string }],
  "deadline": null | { "days": number, "unit": "days"|"weeks"|"months", "description": string, "triggerEvent": string, "exactQuote": string, "isCrucial": boolean, "warning": string },
  "documentExcerpts": [{ "text": string, "pageRange": string, "relevance": string, "highlightTerms": string[] }],
  "attentionItems": [{ "title": string, "description": string, "severity": "high"|"medium"|"low", "order": number }],
  "lawyerQuestions": [{ "question": string, "context": string, "documentBasis": string, "order": number }],
  "hindiTranslation": { "summaryHindi": string, "keyFactsHindi": [{"label": string, "value": string}], "deadlineHindi": string | null, "attentionItemsHindi": [{"title": string, "description": string}] },
  "legalHelpResources": [{ "name": string, "type": "DLSA"|"NGO"|"helpline"|"online", "description": string, "contact": string, "url": string, "relevance": string }],
  "safetyDisclaimer": "This is informational civic assistance only. NyayaLens is not a lawyer and this is not formal legal advice. Consult a qualified advocate for representation.",
  "confidenceScore": number
}`;
}

// ─── Gemini Error Classifier ──────────────────────────────────────────────────
function classifyGeminiError(status: number, body: string): string {
  switch (status) {
    case 400: return `Invalid request sent to Gemini (400). The document may be in an unsupported format. Try a clearer PDF or image.`;
    case 401: return `Gemini authentication failed (401). Your GEMINI_API_KEY is invalid or expired. Please update it in .env.local.`;
    case 403: return `Gemini access denied (403). Your API key may not have access to this model or region. Check your Google AI Studio project settings.`;
    case 429: return `Gemini rate limit reached (429). You have exceeded your quota. Please wait a few minutes before retrying.`;
    case 503: return `Gemini is temporarily busy (503). The model is experiencing high demand. Please try again in a moment.`;
    case 500: return `Gemini server error (500). This is a temporary issue on Google's side. Please try again shortly.`;
    default:  return `Gemini API error (${status}): ${body.slice(0, 200)}`;
  }
}

// ─── Real Gemini API Call with Exponential Backoff & Fallback ───────────────
async function callGeminiREST(
  apiKey: string,
  fileBase64: string,
  mimeType: string,
  fileName: string
): Promise<string> {
  // Current stable production models (support multimodal + structured JSON)
  const MODELS = ['gemini-1.5-flash', 'gemini-1.5-pro'];
  
  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${SYSTEM_PROMPT}\n\nAnalyze this legal notice document: "${fileName}"`,
          },
          {
            inline_data: { mime_type: mimeType, data: fileBase64 },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  };

  const RETRYABLE_STATUSES = new Set([503, 500]);
  const MAX_ATTEMPTS_PER_MODEL = 4;
  const BASE_DELAY_MS = 1000; // 1s → 2s → 4s

  let lastError = '';
  let lastStatus = 0;

  for (const model of MODELS) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    
    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
      console.log(`[Gemini] Attempt ${attempt}/${MAX_ATTEMPTS_PER_MODEL} with model: ${model} (file: "${fileName}")`);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      // ── Success ───────────────────────────────────────────────────────────────
      if (res.ok) {
        const data = await res.json();
        
        const candidate = data?.candidates?.[0];
        const text: string = candidate?.content?.parts?.[0]?.text ?? '';
        const finishReason = candidate?.finishReason;

        if (!text) {
          console.error('[Gemini] Empty response body. Full data:', JSON.stringify(data).slice(0, 500));
          
          if (finishReason === 'SAFETY') {
             throw new Error('Gemini refused to process this document due to safety filters.');
          } else if (finishReason === 'RECITATION') {
             throw new Error('Gemini refused to process this document due to recitation blocks.');
          } else if (data.promptFeedback?.blockReason) {
             throw new Error(`The prompt or document was blocked: ${data.promptFeedback.blockReason}`);
          } else {
             throw new Error('Gemini did not return analyzable content. It may be unreadable, unsupported, or blank.');
          }
        }

        console.log(`[Gemini] Success on attempt ${attempt} with ${model}.`);
        return text;
      }

      // ── Error ─────────────────────────────────────────────────────────────────
      lastStatus = res.status;
      const errBody = await res.text();
      lastError = classifyGeminiError(res.status, errBody);

      console.error(`[Gemini] ${model} attempt ${attempt} failed — HTTP ${res.status}:`, errBody.slice(0, 200));

      // Non-retryable errors (e.g. 401, 403, 400) — fail immediately
      if (!RETRYABLE_STATUSES.has(res.status)) {
        console.error(`[Gemini] Non-retryable error (${res.status}). Aborting all attempts.`);
        throw new Error(lastError);
      }

      // Retryable (503/500) — wait then retry, unless this was the last attempt for this model
      if (attempt < MAX_ATTEMPTS_PER_MODEL) {
        const baseWait = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        const jitter   = baseWait * 0.3 * (Math.random() * 2 - 1); // ±30%
        const waitMs   = Math.round(baseWait + jitter);
        console.log(`[Gemini] ${res.status} received from ${model} — retrying in ${waitMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
      }
    }
    console.log(`[Gemini] Model ${model} exhausted all retries. Falling back to next model if available...`);
  }

  // All models and retries exhausted
  console.error(`[Gemini] All models and retries failed. Last status: ${lastStatus}`);
  throw new Error(lastError);
}


// ─── POST /api/analyze ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileUrl, fileBase64, fileName, fileType, userId, documentId } = body;

    // ── Input validation ──────────────────────────────────────────────────────
    if ((!fileUrl && !fileBase64) || !fileName || !fileType || !userId || !documentId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: fileBase64 or fileUrl, fileName, fileType, userId, documentId' },
        { status: 400 }
      );
    }

    console.log(`[Gemini] Analyze request received. userId: ${userId}, file: "${fileName}", type: ${fileType}`);

    // ── API Key check ─────────────────────────────────────────────────────────
    // GEMINI_API_KEY must be in .env.local (server-side only, never NEXT_PUBLIC_)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      console.error('[Gemini] GEMINI_API_KEY is not set in environment variables.');
      return NextResponse.json(
        { success: false, error: 'Server configuration error: GEMINI_API_KEY is not set. Add it to .env.local.' },
        { status: 500 }
      );
    }

    // ── Resolve document bytes ────────────────────────────────────────────────
    let fileBase64Final: string;
    if (fileBase64) {
      // Frontend sent base64 directly (preferred path — no storage needed)
      fileBase64Final = fileBase64;
      console.log(`[Gemini] File received as base64. Size: ~${Math.round(fileBase64.length * 0.75 / 1024)}KB`);
    } else {
      // Fallback: fetch from Firebase Storage URL
      console.log(`[Gemini] Fetching document from URL: ${fileUrl}`);
      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        return NextResponse.json(
          { success: false, error: `Failed to fetch document from storage (${fileResponse.status}).` },
          { status: 400 }
        );
      }
      const fileBuffer = await fileResponse.arrayBuffer();
      fileBase64Final = Buffer.from(fileBuffer).toString('base64');
      console.log(`[Gemini] File fetched from URL. Size: ~${Math.round(fileBuffer.byteLength / 1024)}KB`);
    }

    // ── Real Gemini API call ──────────────────────────────────────────────────
    // NO demo bypass. NO mock. NO fallback fake data.
    // Demo login is ONLY for authentication — AI must always be real.
    console.log('[Gemini] Calling Gemini API...');
    let geminiRawText: string;
    try {
      geminiRawText = await callGeminiREST(apiKey, fileBase64Final, fileType, fileName);
    } catch (geminiError: unknown) {
      // Real error — never return fake analysis
      const message = geminiError instanceof Error ? geminiError.message : String(geminiError);
      console.error('[Gemini] Gemini API call failed:', message);
      return NextResponse.json(
        {
          success: false,
          error: `Gemini analysis failed: ${message}`,
        },
        { status: 502 }
      );
    }

    // ── Parse Gemini JSON response ────────────────────────────────────────────
    let analysisData: Partial<AnalysisResult>;
    try {
      // gemini-3.8-flash with responseMimeType:'application/json' returns clean JSON
      analysisData = JSON.parse(geminiRawText);
    } catch {
      // Attempt to extract JSON if wrapped in markdown code fences
      const jsonMatch = geminiRawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analysisData = JSON.parse(jsonMatch[0]);
        } catch {
          console.error('[Gemini] Could not parse extracted JSON block. Raw:', geminiRawText.slice(0, 500));
          return NextResponse.json(
            { success: false, error: 'Gemini returned malformed JSON. Try a clearer document scan.' },
            { status: 502 }
          );
        }
      } else {
        console.error('[Gemini] No JSON found in response. Raw:', geminiRawText.slice(0, 500));
        return NextResponse.json(
          { success: false, error: 'Gemini response did not contain valid JSON. Try a clearer document scan.' },
          { status: 502 }
        );
      }
    }

    // ── Validate critical fields ──────────────────────────────────────────────
    if (!analysisData.noticeCategory || !analysisData.plainEnglishSummary) {
      console.error('[Gemini] Response missing critical fields. Parsed data:', JSON.stringify(analysisData).slice(0, 300));
      return NextResponse.json(
        { success: false, error: 'Gemini analysis incomplete — document may be unreadable, blank, or not a legal notice.' },
        { status: 502 }
      );
    }

    console.log('[Gemini] Analysis successfully parsed and validated.');

    // ── Build final analysis object ───────────────────────────────────────────
    const SAFETY_DISCLAIMER =
      'This is informational civic assistance only. NyayaLens is not a lawyer and this is not formal legal advice. Consult a qualified advocate for representation.';

    const fullAnalysis: AnalysisResult = {
      id: documentId,
      userId,
      fileName,
      fileUrl: undefined,
      createdAt: new Date().toISOString(),
      status: 'ready',
      noticeCategory: analysisData.noticeCategory!,
      plainEnglishSummary: analysisData.plainEnglishSummary!,
      keyFacts: analysisData.keyFacts || [],
      deadline: analysisData.deadline ?? null,
      documentExcerpts: analysisData.documentExcerpts || [],
      attentionItems: (analysisData.attentionItems || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      lawyerQuestions: (analysisData.lawyerQuestions || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      hindiTranslation: analysisData.hindiTranslation ?? {
        summaryHindi: '',
        keyFactsHindi: [],
        attentionItemsHindi: [],
      },
      legalHelpResources: analysisData.legalHelpResources || DEFAULT_LEGAL_HELP,
      safetyDisclaimer: SAFETY_DISCLAIMER,
      confidenceScore: analysisData.confidenceScore ?? 0.8,
    };

    // ── Persist to Firestore (real users only, skip demo) ─────────────────────
    const isDemoUser = userId.startsWith('demo-');
    if (!isDemoUser && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      try {
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents/analyses/${documentId}`;
        const storeResponse = await fetch(firestoreUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: toFirestoreDoc(fullAnalysis) }),
        });
        if (!storeResponse.ok) {
          console.warn('[Firestore] Write failed — analysis returned but not persisted.');
        } else {
          console.log('[Firestore] Analysis persisted successfully.');
        }
      } catch (fsErr) {
        console.warn('[Firestore] Write error (non-fatal):', fsErr);
      }
    }

    return NextResponse.json({
      success: true,
      analysisId: documentId,
      analysis: fullAnalysis,
    });

  } catch (error: unknown) {
    console.error('[/api/analyze] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ─── Firestore REST serialiser ─────────────────────────────────────────────────
function toFirestoreDoc(obj: unknown): Record<string, unknown> {
  if (obj === null || obj === undefined) return {};
  if (typeof obj === 'string') return { stringValue: obj };
  if (typeof obj === 'number') return { doubleValue: obj };
  if (typeof obj === 'boolean') return { booleanValue: obj };
  if (Array.isArray(obj)) {
    return { arrayValue: { values: obj.map(toFirestoreDoc) } };
  }
  if (typeof obj === 'object') {
    const fields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (value !== undefined) fields[key] = toFirestoreDoc(value);
    }
    return { mapValue: { fields } };
  }
  return {};
}

// ─── Default Legal Help Resources ─────────────────────────────────────────────
const DEFAULT_LEGAL_HELP = [
  {
    name: 'District Legal Services Authority (DLSA)',
    type: 'DLSA' as const,
    description: 'Free legal aid for eligible citizens. Visit your district court complex.',
    contact: '15100 (NALSA Helpline)',
    url: 'https://nalsa.gov.in',
    relevance: 'Provides free legal representation and consultation for eligible citizens.',
  },
  {
    name: 'NALSA (National Legal Services Authority)',
    type: 'helpline' as const,
    description: 'National legal aid helpline for all citizens.',
    contact: '15100',
    url: 'https://nalsa.gov.in',
    relevance: 'Free legal aid and referrals to district legal services.',
  },
];
