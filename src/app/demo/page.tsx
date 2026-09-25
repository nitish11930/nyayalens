'use client';

// Demo page — works without auth, uses a hardcoded sample analysis for testing
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnalysisResult } from '@/types';
import styles from '../results/[id]/page.module.css';

const DEMO_ANALYSIS: AnalysisResult = {
  id: 'demo',
  userId: 'demo',
  fileName: 'sample-legal-notice.pdf',
  createdAt: new Date().toISOString(),
  status: 'ready',
  noticeCategory: {
    type: 'Cheque Dishonour Notice',
    legalSection: 'Section 138, Negotiable Instruments Act',
    icon: '📋',
  },
  plainEnglishSummary:
    'You have received a legal notice about a cheque that was returned unpaid by the bank. The sender is giving you an opportunity to pay the amount within the specified time period before they file a criminal complaint under the Negotiable Instruments Act. This is a standard statutory notice required before filing such a case.',
  keyFacts: [
    { label: 'Notice Type', value: 'Cheque Dishonour' },
    { label: 'Relevant Law', value: 'Section 138, NI Act' },
    { label: 'Sender', value: 'Claimant / Payee' },
    { label: 'Recipient', value: 'Drawer of Cheque' },
  ],
  deadline: {
    days: 15,
    unit: 'days',
    description: '15 Days from Date of Receipt of this Notice',
    triggerEvent: 'receipt of this notice',
    exactQuote: '...hereby call upon you to pay the said amount within 15 days of receipt of this notice, failing which legal proceedings under Section 138 of the Negotiable Instruments Act, 1881 shall be instituted against you without further reference...',
    isCrucial: true,
    warning: 'The statutory clock begins only upon confirmed receipt. Preserve postal speed-post tracking slip or envelope date stamp immediately.',
  },
  documentExcerpts: [
    {
      text: '...hereby call upon you to pay the said amount within 15 days of receipt of this notice, failing which legal proceedings under Section 138 of the Negotiable Instruments Act, 1881 shall be instituted against you without further reference...',
      pageRange: 'Page 1',
      relevance: 'Core demand and legal consequence',
      highlightTerms: ['15 days', 'Section 138'],
    },
  ],
  attentionItems: [
    {
      title: 'Underlying Transaction Dispute',
      description: 'Verify the nature of the transaction — whether it was a personal loan, commercial debt, or gift. The legal enforceability differs.',
      severity: 'high',
      order: 1,
    },
    {
      title: 'Statutory 15-Day Window',
      description: 'The legal clock begins only upon confirmed receipt. Preserve postal tracking slip or envelope date stamp immediately.',
      severity: 'high',
      order: 2,
    },
    {
      title: 'Written Reply Option',
      description: 'Consult an advocate about sending a written reply within the statutory timeframe to set record your defense.',
      severity: 'medium',
      order: 3,
    },
  ],
  lawyerQuestions: [
    {
      question: 'Was there a legally enforceable debt underlying this cheque, and what documentation exists to prove it?',
      context: 'The validity of a Section 138 case depends on whether the cheque was issued in discharge of a legally enforceable liability.',
      documentBasis: 'The notice references a debt/obligation but does not specify its nature.',
      order: 1,
    },
    {
      question: 'What is the exact date of receipt of this notice, and how does that affect the 15-day response window?',
      context: 'The 15-day period starts from actual receipt, not the date printed on the notice.',
      documentBasis: 'The notice specifies "15 days of receipt".',
      order: 2,
    },
    {
      question: 'Is there any defense available regarding the cheque — stop payment, insufficient funds, or signature dispute?',
      context: 'Different defenses apply depending on why the cheque was dishonoured.',
      order: 3,
    },
    {
      question: 'Should I send a written reply to this notice before the 15-day period expires?',
      context: 'A properly worded reply can establish defenses and create a paper trail.',
      order: 4,
    },
    {
      question: 'What evidence should I gather now to prepare for potential court proceedings?',
      context: 'Early evidence preservation is critical in cheque dishonour cases.',
      order: 5,
    },
  ],
  hindiTranslation: {
    summaryHindi:
      'आपको एक कानूनी नोटिस मिला है जिसमें बताया गया है कि आपका दिया हुआ चेक बैंक द्वारा अस्वीकृत कर दिया गया है। नोटिस भेजने वाले ने आपको 15 दिन के भीतर राशि चुकाने का अवसर दिया है। यदि आप ऐसा नहीं करते, तो परक्राम्य लिखत अधिनियम की धारा 138 के तहत आपके विरुद्ध आपराधिक कार्यवाही शुरू की जा सकती है।',
    keyFactsHindi: [
      { label: 'नोटिस प्रकार', value: 'चेक डिशऑनर' },
      { label: 'संबंधित कानून', value: 'धारा 138, परक्राम्य लिखत अधिनियम' },
    ],
    deadlineHindi: 'इस नोटिस की प्राप्ति से 15 दिन के भीतर राशि चुकानी होगी।',
    attentionItemsHindi: [
      { title: 'लेन-देन विवाद', description: 'लेन-देन की प्रकृति की जांच करें — व्यक्तिगत ऋण, वाणिज्यिक ऋण, या उपहार।' },
      { title: '15 दिन की समयसीमा', description: 'कानूनी घड़ी केवल पुष्टि की गई रसीद पर शुरू होती है। डाक रसीद तुरंत सुरक्षित रखें।' },
    ],
  },
  legalHelpResources: [
    {
      name: 'NALSA — राष्ट्रीय विधिक सेवा प्राधिकरण',
      type: 'DLSA',
      description: 'Free legal aid for eligible citizens',
      contact: '15100',
      url: 'https://nalsa.gov.in',
      relevance: 'Free legal representation for Section 138 cases',
    },
  ],
  safetyDisclaimer:
    'This is informational civic assistance only. NyayaLens is not a lawyer and this is not formal legal advice. Consult a qualified advocate for representation.',
  confidenceScore: 0.95,
};

export default function DemoPage() {
  const router = useRouter();
  const analysis = DEMO_ANALYSIS;
  const [showHindi, setShowHindi] = useState(false);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/landing')}>← Back</button>
        <div className={styles.headerCenter}>
          <h1 className={styles.headerTitle}>🧪 Demo Analysis</h1>
          <span className={styles.statusBadge}>✅ Demo — Not a real notice</span>
        </div>
        <div className={styles.langToggle}>🌐 EN / हिंदी</div>
      </header>

      <div className={styles.disclaimer}>
        <span>🧪</span>
        <span>This is a demo notice for illustration only. Upload your real notice to get actual analysis.</span>
      </div>

      <main className={styles.main}>
        <div style={{ background: '#fef3c7', border: '2px solid #fbbf24', borderRadius: 12, padding: 14, marginBottom: 4 }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#92400e', marginBottom: 4 }}>🧪 Demo Mode</p>
          <p style={{ fontSize: '0.78rem', color: '#b45309', lineHeight: 1.5 }}>
            This is a sample analysis to show how NyayaLens works. 
            <button onClick={() => router.push('/signup')} style={{ background: 'none', border: 'none', color: '#3730d4', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', fontSize: '0.78rem', fontFamily: 'inherit' }}>
              {' '}Create a free account
            </button>{' '}
            to analyze your own legal notice.
          </p>
        </div>

        {/* Category Card */}
        <div className={styles.categoryCard}>
          <div className={styles.categoryTop}>
            <p className={styles.categoryLabel}>NOTICE CATEGORY</p>
          </div>
          <h2 className={styles.categoryTitle}>{analysis.noticeCategory.type}</h2>
          <p className={styles.categorySection}>({analysis.noticeCategory.legalSection})</p>
          <div className={styles.summaryLabel}>Plain-English breakdown</div>
          <p className={styles.summaryText}>{analysis.plainEnglishSummary}</p>
        </div>

        {/* Key Facts */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>KEY EXTRACTED FACTS</h3>
          <div className={styles.factsGrid}>
            {analysis.keyFacts.map((f, i) => (
              <div key={i} className={styles.factCard}>
                <p className={styles.factLabel}>{f.label}</p>
                <p className={styles.factValue}>{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Deadline */}
        {analysis.deadline && (
          <div className={styles.deadlineCard}>
            <div className={styles.deadlineHeader}>
              <div>
                <p className={styles.deadlineLabel}>STATUTORY RESPONSE DEADLINE</p>
                <div className={styles.deadlineDays}>
                  <span className={styles.deadlineNumber}>{analysis.deadline.days} Days</span>
                  <span className={styles.deadlineUnit}>from {analysis.deadline.triggerEvent}</span>
                </div>
              </div>
              <div className={styles.crucialBadge}>⏰ Crucial Clock</div>
            </div>
            <p className={styles.deadlineDesc}>{analysis.deadline.description}</p>
            <div className={styles.deadlineWarning}>
              <span>⚠️</span>
              <p>{analysis.deadline.warning}</p>
            </div>
          </div>
        )}

        {/* Excerpt */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>DOCUMENT EXCERPT (SAMPLE)</h3>
          <div className={styles.excerptCard}>
            <p className={styles.excerptText}>&ldquo;{analysis.documentExcerpts[0].text}&rdquo;</p>
            <p className={styles.excerptRelevance}>{analysis.documentExcerpts[0].relevance}</p>
          </div>
        </div>

        {/* Attention Items */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitleRed}>❗ What Deserves Immediate Attention</h3>
          <div className={styles.attentionList}>
            {analysis.attentionItems.map((item, i) => (
              <div key={i} className={styles.attentionItem}>
                <div className={styles.attentionNumber}>{i + 1}</div>
                <div>
                  <p className={styles.attentionTitle}>{item.title}</p>
                  <p className={styles.attentionDesc}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hindi Toggle */}
        <div className={styles.hindiToggleSection}>
          <button className={styles.hindiToggleBtn} onClick={() => setShowHindi(!showHindi)}>
            {showHindi ? '🌐 Show English' : '🇮🇳 View in Hindi / हिंदी में देखें'}
          </button>
          {showHindi && (
            <div className={styles.hindiContent}>
              <p className={styles.hindiSummary} lang="hi">{analysis.hindiTranslation.summaryHindi}</p>
              {analysis.hindiTranslation.deadlineHindi && (
                <p className={styles.hindiDeadline} lang="hi">⏰ {analysis.hindiTranslation.deadlineHindi}</p>
              )}
            </div>
          )}
        </div>

        {/* CTA */}
        <button className={styles.questionsBtn} onClick={() => router.push('/signup')}>
          Create Account to Analyze Your Notice →
        </button>

        <div className={styles.safetyCard}>
          <span>⚖️</span>
          <p className={styles.safetyText}>{analysis.safetyDisclaimer}</p>
        </div>
      </main>
    </div>
  );
}
