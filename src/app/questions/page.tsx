'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AnalysisResult, LawyerQuestion } from '@/types';
import BottomNav from '@/components/BottomNav';
import styles from './page.module.css';
import toast from 'react-hot-toast';
import { Suspense } from 'react';

type Lang = 'en' | 'hi';

function QuestionsContent() {
  const { user, isDemoMode } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get('analysisId');
  const langParam = searchParams.get('lang') as Lang | null;

  const [originalAnalysis, setOriginalAnalysis] = useState<AnalysisResult | null>(null);
  const [displayedAnalysis, setDisplayedAnalysis] = useState<AnalysisResult | null>(null);
  const [hindiCache, setHindiCache] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [lang, setLang] = useState<Lang>(() => {
    if (langParam === 'hi') return 'hi';
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('nyayalens_lang') as Lang) || 'en';
    }
    return 'en';
  });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (analysisId) fetchAnalysis();
    else setLoading(false);
  }, [user, analysisId]);

  useEffect(() => {
    if (!originalAnalysis) return;
    if (lang === 'en') {
      setDisplayedAnalysis(originalAnalysis);
    } else {
      if (hindiCache) {
        setDisplayedAnalysis(hindiCache);
      } else {
        translateToHindi(originalAnalysis);
      }
    }
  }, [lang, originalAnalysis]);

  const fetchAnalysis = async () => {
    try {
      let data: AnalysisResult | null = null;

      if (isDemoMode) {
        const stored = sessionStorage.getItem(`nyayalens_demo_result_${analysisId}`);
        if (stored) {
          data = JSON.parse(stored);
        } else {
          toast.error('Demo result expired. Please analyze again.');
          router.push('/analyze');
          return;
        }
      } else {
        const { getDb } = await import('@/lib/firestore');
        const { doc, getDoc } = await import('firebase/firestore');
        const db = await getDb();
        const snap = await getDoc(doc(db, 'analyses', analysisId!));
        if (snap.exists()) {
          data = { id: snap.id, ...snap.data() } as AnalysisResult;
        }
      }

      if (!data) {
        toast.error('Analysis not found');
        router.push('/dashboard');
        return;
      }

      setOriginalAnalysis(data);
      setDisplayedAnalysis(data);

      if (lang === 'hi') translateToHindi(data);
    } catch {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const translateToHindi = useCallback(async (source: AnalysisResult) => {
    setTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis: source, targetLanguage: 'hi' }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Translation failed');

      const merged: AnalysisResult = {
        ...result.translated,
        documentExcerpts: source.documentExcerpts, // always original
      };
      setHindiCache(merged);
      setDisplayedAnalysis(merged);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Hindi translation failed: ${message}`);
      setLang('en');
      localStorage.setItem('nyayalens_lang', 'en');
      setDisplayedAnalysis(source);
    } finally {
      setTranslating(false);
    }
  }, []);

  const handleLangToggle = (newLang: Lang) => {
    if (newLang === lang) return;
    setLang(newLang);
    localStorage.setItem('nyayalens_lang', newLang);
  };

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      <p>Loading questions...</p>
    </div>
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => analysisId ? router.push(`/results/${analysisId}`) : router.push('/dashboard')}>← Back</button>
        <h1 className={styles.title}>
          {lang === 'hi' ? 'वकील के लिए प्रश्न' : 'Lawyer Questions'}
        </h1>
        {/* Language Toggle */}
        <div className={styles.langToggle}>
          <button
            className={`${styles.langBtn} ${lang === 'en' ? styles.langBtnActive : ''}`}
            onClick={() => handleLangToggle('en')}
            disabled={translating}
          >
            🇬🇧 EN
          </button>
          <button
            className={`${styles.langBtn} ${lang === 'hi' ? styles.langBtnActive : ''}`}
            onClick={() => handleLangToggle('hi')}
            disabled={translating}
          >
            🇮🇳 हिंदी
          </button>
        </div>
      </header>

      {translating && (
        <div style={{ background: '#4f46e5', color: 'white', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          {lang === 'hi' ? 'प्रश्नों का हिंदी अनुवाद हो रहा है...' : 'Translating to English...'}
        </div>
      )}

      <div className={styles.disclaimer}>
        <span>ℹ️</span>
        <span>
          {lang === 'hi'
            ? 'ये प्रश्न केवल आपके दस्तावेज़ पर आधारित हैं — सामान्य कानूनी सलाह नहीं।'
            : 'Questions are based on your document only — not general legal advice.'}
        </span>
      </div>

      <main className={styles.main}>
        {!displayedAnalysis ? (
          <div className={styles.noAnalysis}>
            <p className={styles.noAnalysisIcon}>❓</p>
            <h2>No Document Analyzed</h2>
            <p>Upload a legal notice first to generate customized lawyer questions.</p>
            <button className={styles.analyzeBtn} onClick={() => router.push('/analyze')}>
              Analyze a Notice →
            </button>
          </div>
        ) : (
          <>
            <div className={styles.introCard}>
              <p className={styles.introLabel}>
                {lang === 'hi' ? 'आपके दस्तावेज़ के आधार पर' : 'BASED ON YOUR DOCUMENT'}
              </p>
              <h2 className={styles.introTitle}>{displayedAnalysis.noticeCategory?.type}</h2>
              <p className={styles.introDesc}>
                {lang === 'hi'
                  ? `ये ${displayedAnalysis.lawyerQuestions.length} प्रश्न आपके नोटिस की विशिष्ट सामग्री से उत्पन्न किए गए हैं। इन्हें अपने वकील के साथ बैठक में लाएं।`
                  : `These ${displayedAnalysis.lawyerQuestions.length} questions are generated specifically from the content of your notice. Bring them to your lawyer consultation.`}
              </p>
            </div>

            <div className={styles.questionsList}>
              {displayedAnalysis.lawyerQuestions
                .sort((a, b) => a.order - b.order)
                .map((q, i) => (
                  <QuestionCard
                    key={i}
                    question={q}
                    index={i + 1}
                    expanded={expandedQ === i}
                    onToggle={() => setExpandedQ(expandedQ === i ? null : i)}
                    lang={lang}
                  />
                ))}
            </div>

            <div className={styles.exportCard}>
              <p className={styles.exportTitle}>
                {lang === 'hi' ? '📋 परामर्श के लिए सहेजें' : '📋 Save for Your Consultation'}
              </p>
              <p className={styles.exportDesc}>
                {lang === 'hi'
                  ? 'अपने अधिवक्ता से मिलने से पहले इन प्रश्नों को प्रिंट या शेयर करें।'
                  : 'Print or share these questions before meeting your advocate.'}
              </p>
              <button
                className={styles.exportBtn}
                onClick={() => {
                  const text = displayedAnalysis.lawyerQuestions
                    .map((q, i) => `${i + 1}. ${q.question}\n   ${lang === 'hi' ? 'संदर्भ' : 'Context'}: ${q.context}`)
                    .join('\n\n');
                  navigator.clipboard.writeText(text);
                  toast.success(lang === 'hi' ? 'प्रश्न कॉपी हो गए!' : 'Questions copied to clipboard!');
                }}
              >
                📋 {lang === 'hi' ? 'सभी प्रश्न कॉपी करें' : 'Copy All Questions'}
              </button>
            </div>

            <div className={styles.dlsaCard}>
              <span>🏛️</span>
              <div>
                <p className={styles.dlsaTitle}>
                  {lang === 'hi' ? 'निःशुल्क कानूनी सहायता चाहिए?' : 'Need Free Legal Aid?'}
                </p>
                <p className={styles.dlsaDesc}>
                  {lang === 'hi'
                    ? 'जिला कानूनी सेवा प्राधिकरण (DLSA) पात्र नागरिकों को निःशुल्क कानूनी सहायता प्रदान करता है।'
                    : 'District Legal Services Authority (DLSA) provides free legal assistance to eligible citizens.'}
                </p>
                <button className={styles.dlsaBtn} onClick={() => router.push('/legal-help')}>
                  {lang === 'hi' ? 'नजदीकी DLSA खोजें →' : 'Find DLSA Near You →'}
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      <BottomNav active="questions" />
    </div>
  );
}

function QuestionCard({ question, index, expanded, onToggle, lang }: {
  question: LawyerQuestion;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  lang: Lang;
}) {
  return (
    <div className={`${styles.questionCard} ${expanded ? styles.questionExpanded : ''}`}>
      <button className={styles.questionHeader} onClick={onToggle}>
        <span className={styles.questionNum}>{index}</span>
        <p className={styles.questionText}>{question.question}</p>
        <span className={styles.chevron}>{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className={styles.questionBody}>
          <p className={styles.contextLabel}>
            {lang === 'hi' ? 'यह क्यों पूछें:' : 'Why ask this:'}
          </p>
          <p className={styles.contextText}>{question.context}</p>
          {question.documentBasis && (
            <>
              <p className={styles.contextLabel}>
                {lang === 'hi' ? 'आपके दस्तावेज़ से:' : 'From your document:'}
              </p>
              <p className={styles.docBasis}>&ldquo;{question.documentBasis}&rdquo;</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Loading...</p></div>}>
      <QuestionsContent />
    </Suspense>
  );
}
