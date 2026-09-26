import { NextRequest, NextResponse } from 'next/server';

// ─── POST /api/translate ───────────────────────────────────────────────────────
// Translates an already-generated analysis JSON from English → Hindi (or reverse).
// DOES NOT re-analyze the document. Preserves all factual values.
// Verbatim source excerpts are NEVER translated.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { analysis, targetLanguage } = body;

    if (!analysis || !targetLanguage) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: analysis, targetLanguage' },
        { status: 400 }
      );
    }

    if (targetLanguage !== 'hi' && targetLanguage !== 'en') {
      return NextResponse.json(
        { success: false, error: 'targetLanguage must be "hi" or "en"' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    const langLabel = targetLanguage === 'hi' ? 'Hindi' : 'English';
    const sourceLang = targetLanguage === 'hi' ? 'English' : 'Hindi';

    // Build the structured analysis to translate (exclude verbatim excerpts)
    const keyFactsArr = Array.isArray(analysis.keyFacts) ? analysis.keyFacts : [];
    const attentionArr = Array.isArray(analysis.attentionItems) ? analysis.attentionItems : [];
    const questionsArr = Array.isArray(analysis.lawyerQuestions) ? analysis.lawyerQuestions : [];

    const toTranslate = {
      noticeCategory: {
        type: analysis.noticeCategory?.type,
      },
      plainEnglishSummary: analysis.plainEnglishSummary,
      keyFacts: keyFactsArr.map((f: { label: string; value: string; sourcePageLine: string }) => ({
        label: f.label,
        value: f.value,
        sourcePageLine: f.sourcePageLine,
      })),
      deadline: analysis.deadline ? {
        description: analysis.deadline.description,
        triggerEvent: analysis.deadline.triggerEvent,
        warning: analysis.deadline.warning,
      } : null,
      attentionItems: attentionArr.map((a: { title: string; description: string; severity: string; order: number }) => ({
        title: a.title,
        description: a.description,
      })),
      lawyerQuestions: questionsArr.map((q: { question: string; context: string; documentBasis: string; order: number }) => ({
        question: q.question,
        context: q.context,
        documentBasis: q.documentBasis,
      })),
    };

    const translationPrompt = `You are a professional legal document translator.

Translate the following JSON fields from ${sourceLang} to ${langLabel}.

STRICT RULES:
- Translate ONLY the text values that contain natural language sentences/phrases.
- DO NOT translate: names of people, organizations, amounts (₹), dates, legal section numbers (e.g. "Section 138"), case/reference numbers, the word "not_determinable".
- DO NOT add any information not present in the source.
- DO NOT remove any information present in the source.
- DO NOT re-analyze or change the factual meaning.
- Preserve the EXACT JSON structure and all field names.
- Return ONLY valid JSON, no markdown, no code blocks, no explanation.
- For legal terminology, you may keep the English term in parentheses after the ${langLabel} translation for clarity.
- Use simple, citizen-friendly ${langLabel} that is easy to understand.

JSON to translate:
${JSON.stringify(toTranslate, null, 2)}`;

    console.log(`[Translate] Translating analysis to ${langLabel} using gemini-3.8-flash...`);

    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: translationPrompt }] }],
          generationConfig: {
            temperature: 0.1,
            topP: 0.8,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Translate] Gemini API error (${res.status}):`, errText.slice(0, 300));
      return NextResponse.json(
        { success: false, error: `Translation failed: Gemini API error ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!rawText) {
      return NextResponse.json(
        { success: false, error: 'Gemini returned empty translation response' },
        { status: 502 }
      );
    }

    let translated: typeof toTranslate;
    try {
      translated = JSON.parse(rawText);
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        translated = JSON.parse(jsonMatch[0]);
      } else {
        console.error('[Translate] Could not parse JSON from translation response:', rawText.slice(0, 300));
        return NextResponse.json(
          { success: false, error: 'Translation response was not valid JSON' },
          { status: 502 }
        );
      }
    }

    // Merge translated text back with original (preserve all factual/numeric fields)
    const originalKeyFacts = Array.isArray(analysis.keyFacts) ? analysis.keyFacts : [];
    const originalAttention = Array.isArray(analysis.attentionItems) ? analysis.attentionItems : [];
    const originalQuestions = Array.isArray(analysis.lawyerQuestions) ? analysis.lawyerQuestions : [];
    const translatedKeyFacts = Array.isArray(translated.keyFacts) ? translated.keyFacts : [];
    const translatedAttention = Array.isArray(translated.attentionItems) ? translated.attentionItems : [];
    const translatedQuestions = Array.isArray(translated.lawyerQuestions) ? translated.lawyerQuestions : [];

    const mergedAnalysis = {
      ...analysis,
      noticeCategory: {
        ...analysis.noticeCategory,
        type: translated.noticeCategory?.type ?? analysis.noticeCategory?.type,
      },
      plainEnglishSummary: translated.plainEnglishSummary ?? analysis.plainEnglishSummary,
      keyFacts: originalKeyFacts.map((f: { label: string; value: string; sourcePageLine: string }, i: number) => ({
        ...f,
        label: translatedKeyFacts[i]?.label ?? f.label,
        value: translatedKeyFacts[i]?.value ?? f.value,
      })),
      deadline: analysis.deadline ? {
        ...analysis.deadline,
        description: translated.deadline?.description ?? analysis.deadline.description,
        triggerEvent: translated.deadline?.triggerEvent ?? analysis.deadline.triggerEvent,
        warning: translated.deadline?.warning ?? analysis.deadline.warning,
      } : null,
      attentionItems: originalAttention.map((a: { title: string; description: string; severity: string; order: number }, i: number) => ({
        ...a,
        title: translatedAttention[i]?.title ?? a.title,
        description: translatedAttention[i]?.description ?? a.description,
      })),
      lawyerQuestions: originalQuestions.map((q: { question: string; context: string; documentBasis: string; order: number }, i: number) => ({
        ...q,
        question: translatedQuestions[i]?.question ?? q.question,
        context: translatedQuestions[i]?.context ?? q.context,
        documentBasis: translatedQuestions[i]?.documentBasis ?? q.documentBasis,
      })),
      // documentExcerpts: NEVER translated
    };

    console.log(`[Translate] Translation to ${langLabel} complete.`);

    return NextResponse.json({ success: true, translated: mergedAnalysis });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[/api/translate] Error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
