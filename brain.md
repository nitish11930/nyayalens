# NyayaLens — Brain Document

## Product
India-first Legal Notice Navigator
Tagline: "Understand the notice. Prepare for what's next."

## Architecture
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Auth: Firebase Authentication
- Database: Firebase Firestore
- Storage: Firebase Storage
- AI: Google Gemini 1.5 Pro
- Styling: Vanilla CSS Modules

## Routes
- / → redirects based on auth state
- /landing → public landing page
- /login → Firebase email/password + Google OAuth
- /signup → account creation with zero-retention toggle
- /demo → sample analysis without auth
- /dashboard → authenticated home with recent analyses
- /analyze → upload + Gemini analysis flow
- /results/[id] → full analysis results
- /questions → lawyer questions from analysis
- /notices → list of all analyzed notices
- /legal-help → free legal aid resources
- /profile → account, document vault, shred

## API Routes
- POST /api/analyze → Gemini 1.5 Pro analysis

## Key Decisions
1. Zero-Retention: Files deleted from Storage after analysis
2. Safety: Disclaimer enforced at schema + API level
3. No hardcoded data: All results from actual document analysis
4. Firestore security: Each user can only read their own analyses

## Safety Constraints (HARD RULES)
- NEVER predict outcomes
- NEVER invent deadlines
- NEVER fabricate citations
- ALWAYS show safety disclaimer
- ALWAYS attribute quotes to document source
