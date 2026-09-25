// TypeScript types for NyayaLens analysis output
// These match the JSON schema in schemas/legal-notice.schema.json

export interface AnalysisResult {
  id: string;
  userId: string;
  fileName: string;
  fileUrl?: string;
  createdAt: string;
  status: 'processing' | 'ready' | 'error';

  // Core analysis fields — all derived from document content only
  noticeCategory: NoticeCategory;
  plainEnglishSummary: string;
  keyFacts: KeyFact[];
  deadline: DeadlineInfo | null;
  documentExcerpts: DocumentExcerpt[];
  attentionItems: AttentionItem[];
  lawyerQuestions: LawyerQuestion[];
  hindiTranslation: HindiTranslation;
  legalHelpResources: LegalHelpResource[];

  // Safety flags
  safetyDisclaimer: string;
  confidenceScore: number; // 0–1
  ocrConfidence?: number;   // 0–1, if OCR was used
}

export interface NoticeCategory {
  type: string;           // e.g. "Cheque Dishonour Notice"
  legalSection?: string;  // e.g. "Section 138, NI Act"
  icon: string;           // emoji or icon key
}

export interface KeyFact {
  label: string;    // e.g. "Disputed Amount"
  value: string;    // e.g. "₹2,40,000"
  sourcePageLine?: string; // e.g. "Page 1, Line 3"
}

export interface DeadlineInfo {
  days: number;
  unit: 'days' | 'weeks' | 'months';
  description: string;       // Human-readable, from document
  triggerEvent: string;      // What starts the clock
  exactQuote: string;        // The verbatim text from the document
  isCrucial: boolean;
  warning: string;           // e.g. "Verify exact receipt date"
}

export interface DocumentExcerpt {
  text: string;             // Verbatim quote from document
  pageRange?: string;       // e.g. "Page 1, Lines 18–25"
  relevance: string;        // Why this excerpt matters
  highlightTerms?: string[]; // Terms to highlight in UI
}

export interface AttentionItem {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  order: number;
}

export interface LawyerQuestion {
  question: string;          // The question to ask a lawyer
  context: string;           // Why this question is relevant
  documentBasis?: string;    // What in the doc triggered this
  order: number;
}

export interface HindiTranslation {
  summaryHindi: string;
  keyFactsHindi: Array<{ label: string; value: string }>;
  deadlineHindi?: string;
  attentionItemsHindi: Array<{ title: string; description: string }>;
}

export interface LegalHelpResource {
  name: string;
  type: 'DLSA' | 'NGO' | 'helpline' | 'online';
  description: string;
  contact?: string;
  url?: string;
  relevance: string;
}

// Auth & User types
export interface NyayaUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  zeroRetentionEnabled: boolean;
  language: 'en' | 'hi';
  analysisCount: number;
}

// Upload state
export interface UploadState {
  status: 'idle' | 'validating' | 'uploading' | 'analyzing' | 'complete' | 'error';
  progress: number; // 0–100
  error?: string;
  analysisId?: string;
}

// API request/response types
export interface AnalyzeRequest {
  fileUrl: string;
  fileName: string;
  fileType: 'application/pdf' | 'image/jpeg' | 'image/png';
  userId: string;
  documentId: string;
}

export interface AnalyzeResponse {
  success: boolean;
  analysisId?: string;
  analysis?: AnalysisResult;
  error?: string;
}
