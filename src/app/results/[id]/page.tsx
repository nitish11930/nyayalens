'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AnalysisResult } from '@/types';
import BottomNav from '@/components/BottomNav';
import styles from './page.module.css';
import toast from 'react-hot-toast';

type Lang = 'en' | 'hi';

export default function ResultsPage() {
  const { user, isDemoMode } = useAuth();
  const router = useRouter();
  const params = useParams();
  const analysisId = params.id as string;

  // Original English analysis — never mutated
  const [originalAnalysis, setOriginalAnalysis] = useState<AnalysisResult | null>(null);
  // Displayed analysis — switches between English and translated Hindi
  const [displayedAnalysis, setDisplayedAnalysis] = useState<AnalysisResult | null>(null);
  // Cache translated version to avoid re-calling Gemini on re-toggle
  const [hindiCache, setHindiCache] = useState<AnalysisResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [lang, setLang] = useState<Lang>(() => {
    // Persist language preference
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('nyayalens_lang') as Lang) || 'en';
    }
    return 'en';
  });

  // ── Load analysis ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (analysisId) fetchAnalysis();
  }, [user, analysisId]);

  // ── Re-apply language when analysis or lang changes ──────────────────────────
  useEffect(() => {
    if (!originalAnalysis) return;
    if (lang === 'en') {
      setDisplayedAnalysis(originalAnalysis);
    } else {
      // If we already have Hindi cached, use it instantly
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
          toast.error('Demo result not found. Please analyze again.');
          router.push('/analyze');
          return;
        }
      } else {
        const { getDb } = await import('@/lib/firestore');
        const { doc, getDoc } = await import('firebase/firestore');
        const db = await getDb();
        const snap = await getDoc(doc(db, 'analyses', analysisId));
        if (!snap.exists()) {
          toast.error('Analysis not found');
          router.push('/dashboard');
          return;
        }
        const d = snap.data() as AnalysisResult;
        if (d.userId !== user?.uid) {
          toast.error('Access denied');
          router.push('/dashboard');
          return;
        }
        data = d;
      }

      setOriginalAnalysis(data);
      setDisplayedAnalysis(data);

      // If user had Hindi selected, auto-translate
      if (lang === 'hi' && data) {
        translateToHindi(data);
      }
    } catch {
      toast.error('Failed to load analysis');
      router.push('/dashboard');
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

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Translation failed');
      }

      // Preserve original verbatim excerpts — never translate those
      const mergedWithOriginalExcerpts: AnalysisResult = {
        ...result.translated,
        documentExcerpts: source.documentExcerpts, // ALWAYS original verbatim
      };

      setHindiCache(mergedWithOriginalExcerpts);
      setDisplayedAnalysis(mergedWithOriginalExcerpts);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Hindi translation could not be generated: ${message}`);
      // Revert to English — don't leave user with partial/broken state
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

  if (loading) return <LoadingState />;
  if (!displayedAnalysis || !originalAnalysis) return null;

  const {
    deadline,
    attentionItems,
    lawyerQuestions,
    documentExcerpts,
    keyFacts,
    noticeCategory,
    plainEnglishSummary,
    legalHelpResources,
  } = displayedAnalysis;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/dashboard')}>← Back</button>
        <div className={styles.headerCenter}>
          <h1 className={styles.headerTitle}>{originalAnalysis.noticeCategory?.legalSection || 'Notice'} Analysis</h1>
          <span className={styles.statusBadge}>✅ Status: Analysis Ready</span>
        </div>

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

      {/* Translating Banner */}
      {translating && (
        <div style={{
          background: '#4f46e5',
          color: 'white',
          textAlign: 'center',
          fontSize: '0.8rem',
          fontWeight: 600,
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}>
          <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          {lang === 'hi' ? 'हिंदी में अनुवाद हो रहा है...' : 'Translating to English...'}
        </div>
      )}

      <div className={styles.disclaimer}>
        <span>ℹ️</span>
        <span>
          {lang === 'hi'
            ? 'यह सूचनात्मक सहायता है — औपचारिक कानूनी सलाह नहीं।'
            : 'Informational assistance — not formal legal advice.'}
        </span>
      </div>

      <main className={styles.main}>
        {/* Notice Category Card */}
        <div className={styles.categoryCard}>
          <div className={styles.categoryTop}>
            <p className={styles.categoryLabel}>
              {lang === 'hi' ? 'नोटिस श्रेणी' : 'NOTICE CATEGORY'}
            </p>
            <button className={styles.shareBtn} onClick={() => toast.success('Export coming soon')}>📤</button>
          </div>
          <h2 className={styles.categoryTitle}>{noticeCategory.type}</h2>
          {/* Legal section always in original (never translated) */}
          {originalAnalysis.noticeCategory.legalSection && (
            <p className={styles.categorySection}>({originalAnalysis.noticeCategory.legalSection})</p>
          )}

          <div className={styles.summaryLabel}>
            {lang === 'hi' ? 'सरल भाषा में सारांश' : 'Plain-language breakdown'}
          </div>
          <p className={styles.summaryText}>{plainEnglishSummary}</p>
        </div>

        {/* Key Facts */}
        {keyFacts.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              {lang === 'hi' ? 'मुख्य तथ्य' : 'KEY EXTRACTED FACTS'}
            </h3>
            <div className={styles.factsGrid}>
              {keyFacts.map((fact, i) => (
                <div key={i} className={styles.factCard}>
                  <p className={styles.factLabel}>{fact.label}</p>
                  <p className={styles.factValue}>{fact.value}</p>
                  {/* Source page line always in original language */}
                  {originalAnalysis.keyFacts?.[i]?.sourcePageLine && (
                    <p className={styles.factSource}>{originalAnalysis.keyFacts[i].sourcePageLine}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deadline Card */}
        {deadline && (
          <div className={styles.deadlineCard}>
            <div className={styles.deadlineHeader}>
              <div>
                <p className={styles.deadlineLabel}>
                  {lang === 'hi' ? 'वैधानिक उत्तर की समय-सीमा' : 'STATUTORY RESPONSE DEADLINE'}
                </p>
                <div className={styles.deadlineDays}>
                  {/* Days & unit: always original (numeric fact) */}
                  <span className={styles.deadlineNumber}>{originalAnalysis.deadline?.days} {originalAnalysis.deadline?.unit}</span>
                  <span className={styles.deadlineUnit}>{lang === 'hi' ? 'से' : 'from'} {deadline.triggerEvent}</span>
                </div>
              </div>
              {originalAnalysis.deadline?.isCrucial && (
                <div className={styles.crucialBadge}>
                  {lang === 'hi' ? '⏰ महत्वपूर्ण' : '⏰ Crucial Clock'}
                </div>
              )}
            </div>
            <p className={styles.deadlineDesc}>{deadline.description}</p>
            <div className={styles.deadlineWarning}>
              <span>⚠️</span>
              <p>{deadline.warning}</p>
            </div>
            {/* Original verbatim quote — NEVER translated */}
            {originalAnalysis.deadline?.exactQuote && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.15)', borderRadius: 6, fontSize: '0.78rem' }}>
                <span style={{ opacity: 0.7 }}>{lang === 'hi' ? 'दस्तावेज़ से (मूल)' : 'Source (verbatim)'}:</span>{' '}
                <em>&ldquo;{originalAnalysis.deadline.exactQuote}&rdquo;</em>
              </div>
            )}
          </div>
        )}

        {/* Document Excerpt — ALWAYS original verbatim, NEVER translated */}
        {documentExcerpts.length > 0 && (
          <div className={styles.section}>
            <div className={styles.excerptHeader}>
              <h3 className={styles.sectionTitle}>
                {lang === 'hi' ? '✅ दस्तावेज़ का मूल अंश (अनुवादित नहीं)' : '✅ VERIFIED DOCUMENT EXCERPT'}
              </h3>
              {documentExcerpts[0].pageRange && (
                <span className={styles.pageRange}>{documentExcerpts[0].pageRange}</span>
              )}
            </div>
            <div className={styles.excerptCard}>
              <p className={styles.excerptText}>
                &ldquo;{documentExcerpts[0].text}&rdquo;
              </p>
              <p className={styles.excerptRelevance}>
                {lang === 'hi' ? 'प्रासंगिकता: ' : ''}{documentExcerpts[0].relevance}
              </p>
              <div className={styles.excerptActions}>
                <button
                  className={styles.copyBtn}
                  onClick={() => {
                    navigator.clipboard.writeText(documentExcerpts[0].text);
                    toast.success('Excerpt copied');
                  }}
                >
                  📋 {lang === 'hi' ? 'कॉपी करें' : 'Copy Citation'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Attention Items */}
        {attentionItems.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitleRed}>
              {lang === 'hi' ? '❗ तत्काल ध्यान देने योग्य बातें' : '❗ What Deserves Immediate Attention'}
            </h3>
            <div className={styles.attentionList}>
              {attentionItems.sort((a, b) => a.order - b.order).map((item, i) => (
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
        )}

        {/* Lawyer Questions — CTA */}
        <button
          id="review-questions-btn"
          className={styles.questionsBtn}
          onClick={() => router.push(`/questions?analysisId=${analysisId}&lang=${lang}`)}
        >
          {lang === 'hi'
            ? `वकील के लिए ${lawyerQuestions.length} प्रश्न देखें →`
            : `Review ${lawyerQuestions.length} Lawyer Questions →`}
        </button>

        {/* Legal Help Resources */}
        {legalHelpResources.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              {lang === 'hi' ? '⚖️ निःशुल्क कानूनी सहायता' : '⚖️ FREE LEGAL HELP RESOURCES'}
            </h3>
            {legalHelpResources.map((resource, i) => (
              <div key={i} className={styles.resourceCard}>
                <div className={styles.resourceHeader}>
                  <span className={styles.resourceType}>{resource.type}</span>
                  <p className={styles.resourceName}>{resource.name}</p>
                </div>
                <p className={styles.resourceDesc}>{resource.description}</p>
                <p className={styles.resourceRelevance}>{resource.relevance}</p>
                {(resource.contact || resource.url) && (
                  <div className={styles.resourceContact}>
                    {resource.contact && <span>📞 {resource.contact}</span>}
                    {resource.url && (
                      <a href={resource.url} target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>
                        🌐 Visit →
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Safety Disclaimer */}
        <div className={styles.safetyCard}>
          <span>⚖️</span>
          <p className={styles.safetyText}>
            {lang === 'hi'
              ? 'यह केवल सूचनात्मक नागरिक सहायता है। NyayaLens एक वकील नहीं है और यह औपचारिक कानूनी सलाह नहीं है। प्रतिनिधित्व के लिए एक योग्य अधिवक्ता से परामर्श करें।'
              : originalAnalysis.safetyDisclaimer}
          </p>
        </div>
      </main>

      <BottomNav active="notices" />
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#f9fafb' }}>
      <div style={{ width: 48, height: 48, border: '3px solid #e0e7ff', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#6b7280', fontWeight: 500 }}>Loading analysis...</p>
    </div>
  );
}
