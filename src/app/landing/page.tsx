'use client';

import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className={styles.landing}>
      {/* Status Bar */}
      <div className={styles.statusBar}>
        <span>NyayaLens v1.0 (Citizen Edition)</span>
        <span>IT Act Sec 43A</span>
        <span>Zero-Retention</span>
      </div>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBrand}>
            <div className={styles.brandIcon}>⚖️</div>
            <div>
              <h1 className={styles.brandTitle}>NyayaLens</h1>
              <p className={styles.brandSubtitle} lang="hi">न्यायालेंस — Legal Intelligence</p>
            </div>
          </div>

          <div className={styles.disclaimerBanner}>
            <span>🛡️</span>
            <span>Informational civic assistance — not formal legal advice.</span>
          </div>

          <div className={styles.heroContent}>
            <div className={styles.heroTag}>🇮🇳 India-First Legal Notice Navigator</div>
            <h2 className={styles.heroHeading}>
              Understand the Notice.<br />
              <span className={styles.heroAccent}>Prepare for What's Next.</span>
            </h2>
            <p className={styles.heroDesc}>
              Upload any Indian legal notice — cheque bounce, tenancy, recovery, defamation — 
              and get a plain-language breakdown, key facts, statutory timelines, and lawyer questions. 
              In English and Hindi.
            </p>

            <div className={styles.heroCtas}>
              <button
                className={`${styles.ctaPrimary}`}
                onClick={() => router.push('/signup')}
              >
                <span>✨</span> Create Free Account / <span lang="hi">खाता बनाएं</span>
              </button>
              <button
                className={styles.ctaSecondary}
                onClick={() => router.push('/login')}
              >
                Sign In / <span lang="hi">लॉगिन करें</span>
              </button>
            </div>

            <button
              className={styles.demoLink}
              onClick={() => router.push('/demo')}
            >
              🧪 Try Demo Notice without account
            </button>
          </div>

          {/* Feature Cards */}
          <div className={styles.featureGrid}>
            {features.map((f, i) => (
              <div key={i} className={styles.featureCard}>
                <span className={styles.featureIcon}>{f.icon}</span>
                <div>
                  <p className={styles.featureTitle}>{f.title}</p>
                  <p className={styles.featureDesc}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Notice Types */}
          <div className={styles.noticeTypes}>
            <p className={styles.noticeTypesLabel}>Supported Notice Types</p>
            <div className={styles.noticeTypeTags}>
              {noticeTypes.map((t, i) => (
                <span key={i} className={styles.noticeTypeTag}>{t}</span>
              ))}
            </div>
          </div>

          {/* Privacy Card */}
          <div className={styles.privacyCard}>
            <span className={styles.privacyIcon}>🔐</span>
            <div>
              <p className={styles.privacyTitle}>Zero-Retention Confidentiality</p>
              <p className={styles.privacyDesc}>
                Your files are shredded automatically post-extraction. 
                No citizen document is trained on public AI models.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>NyayaLens provides informational civic assistance only.</p>
        <p>Not a lawyer. Not formal legal advice. Consult an enrolled advocate or DLSA.</p>
      </footer>
    </div>
  );
}

const features = [
  { icon: '📄', title: 'Plain-Language Breakdown', desc: 'Complex legal jargon translated to everyday language' },
  { icon: '⏱️', title: 'Statutory Timelines', desc: 'Deadlines extracted strictly from your document' },
  { icon: '❓', title: '5 Lawyer Questions', desc: 'Customised questions based on your specific notice' },
  { icon: '🇮🇳', title: 'Hindi Translation', desc: 'Full analysis in Hindi / हिंदी में पूर्ण विश्लेषण' },
  { icon: '⚖️', title: 'Free Legal Aid', desc: 'DLSA and legal-aid resources for your case type' },
  { icon: '🛡️', title: 'Privacy-First', desc: 'Zero data retention. Your documents never stored.' },
];

const noticeTypes = [
  '📋 Section 138 NI Act', '🏠 Tenancy / Eviction', '💰 Money Recovery',
  '📢 Defamation', '🏢 Consumer Dispute', '👔 Employment',
  '🏗️ Property Dispute', '👨‍👩‍👧 Family Law',
];
