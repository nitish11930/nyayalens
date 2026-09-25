# NyayaLens ⚖️

> **Understand the notice. Prepare for what's next.**

NyayaLens is an India-first Legal Notice Navigator that helps citizens decode complex legal notices (like Cheque Bounce, Tenancy, or Demand notices) into plain, everyday language using AI.

## 🚀 Features
- **AI Document Translation:** Instantly converts complex legal jargon into an easy-to-understand summary.
- **Smart Data Extraction:** Extracts critical information like sender details, due amounts, and crucial deadlines.
- **Actionable Next Steps:** Generates customized lawyer-ready questions and highlights severe risks (e.g., criminal liability in Section 138).
- **Multilingual Support:** One-click translation of the breakdown into Hindi (and more Indian languages).
- **Zero-Retention Policy:** Uploaded documents are converted to base64, processed directly via AI, and **never permanently stored** on our servers.

## 💻 Tech Stack
- **Frontend:** Next.js 14, React, CSS Modules
- **Backend/API:** Next.js Route Handlers
- **AI/LLM:** Google Gemini 1.5 Flash (via REST API)
- **Database/Auth:** Firebase (Firestore, Auth)

## 🎭 Demo Mode
NyayaLens features a built-in **Hackathon Demo Bypass**. By signing in via the "One-Click Demo", the application completely bypasses external dependencies (API Keys, Firebase Storage limitations) and delivers an instant, pre-computed perfect analysis. This guarantees a 100% reliable showcase during presentations.

## 🛠️ Local Setup
1. Clone the repository.
2. Run \`npm install\` to install dependencies.
3. Copy \`.env.example\` to \`.env.local\` and provide your Firebase and Gemini credentials.
4. Run \`npm run dev\` to start the local development server at \`http://localhost:3000\`.

## 🔒 Privacy First
Designed with strict civic legal literacy guidelines. NyayaLens provides informational assistance, not formal legal advice, empowering citizens before they consult a qualified advocate.
