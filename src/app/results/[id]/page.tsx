'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AnalysisResult } from '@/types';
import BottomNav from '@/components/BottomNav';
import styles from './page.module.css';
import toast from 'react-hot-toast';


export default function ResultsPage() {
  const { user, isDemoMode } = useAuth();
  const router = useRouter();
  const params = useParams();
  const analysisId = params.id as string;

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'hindi' | 'help'>('overview');
  const [showHindi, setShowHindi] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (analysisId) fetchAnalysis();
  }, [user, analysisId]);

  const fetchAnalysis = async () => {
    try {
      // Demo mode: read from sessionStorage (set by analyze page)
      if (isDemoMode) {
        const stored = sessionStorage.getItem(`nyayalens_demo_result_${analysisId}`);
        if (stored) {
          setAnalysis(JSON.parse(stored));
          setLoading(false);
          return;
        }
        toast.error('Demo result expired. Please analyze again.');
        router.push('/analyze');
        return;
      }

      // Real mode: fetch from Firestore
      const { getDb } = await import('@/lib/firestore');
      const { doc, getDoc } = await import('firebase/firestore');
      const db = await getDb();
      const docRef = doc(db, 'analyses', analysisId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        toast.error('Analysis not found');
        router.push('/dashboard');
        return;
      }
      const data = snap.data() as AnalysisResult;
      if (data.userId !== user?.uid) {
        toast.error('Access denied');
        router.push('/dashboard');
        return;
      }
      setAnalysis(data);
    } catch (e) {
      toast.error('Failed to load analysis');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;
  if (!analysis) return null;

  const { deadline, attentionItems, lawyerQuestions, documentExcerpts, keyFacts, noticeCategory, plainEnglishSummary, hindiTranslation, legalHelpResources } = analysis;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/dashboard')}>← Back</button>
        <div className={styles.headerCenter}>
          <h1 className={styles.headerTitle}>{noticeCategory?.legalSection || 'Notice'} Analysis</h1>
          <span className={styles.statusBadge}>✅ Status: Analysis Ready</span>
        </div>
        <div className={styles.langToggle}>🌐 हिंदी / EN</div>
      </header>

      <div className={styles.disclaimer}>
        <span>ℹ️</span>
        <span>Informational assistance — not formal legal advice.</span>
      </div>

      <main className={styles.main}>
        {/* Notice Category Card */}
        <div className={styles.categoryCard}>
          <div className={styles.categoryTop}>
            <p className={styles.categoryLabel}>NOTICE CATEGORY</p>
            <button className={styles.shareBtn} onClick={() => toast.success('Export coming soon')}>📤</button>
          </div>
          <h2 className={styles.categoryTitle}>{noticeCategory.type}</h2>
          {noticeCategory.legalSection && (
            <p className={styles.categorySection}>({noticeCategory.legalSection})</p>
          )}

          <div className={styles.summaryLabel}>Plain-English breakdown</div>
          <p className={styles.summaryText}>{plainEnglishSummary}</p>
        </div>

        {/* Key Facts */}
        {keyFacts.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>KEY EXTRACTED FACTS</h3>
            <div className={styles.factsGrid}>
              {keyFacts.map((fact, i) => (
                <div key={i} className={styles.factCard}>
                  <p className={styles.factLabel}>{fact.label}</p>
                  <p className={styles.factValue}>{fact.value}</p>
                  {fact.sourcePageLine && (
                    <p className={styles.factSource}>{fact.sourcePageLine}</p>
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
                <p className={styles.deadlineLabel}>STATUTORY RESPONSE DEADLINE</p>
                <div className={styles.deadlineDays}>
                  <span className={styles.deadlineNumber}>{deadline.days} Days</span>
                  <span className={styles.deadlineUnit}>from {deadline.triggerEvent}</span>
                </div>
              </div>
              {deadline.isCrucial && (
                <div className={styles.crucialBadge}>⏰ Crucial Clock</div>
              )}
            </div>
            <p className={styles.deadlineDesc}>{deadline.description}</p>
            <div className={styles.deadlineWarning}>
              <span>⚠️</span>
              <p>{deadline.warning}</p>
            </div>
          </div>
        )}

        {/* Document Excerpt */}
        {documentExcerpts.length > 0 && (
          <div className={styles.section}>
            <div className={styles.excerptHeader}>
              <h3 className={styles.sectionTitle}>VERIFIED DOCUMENT EXCERPT</h3>
              {documentExcerpts[0].pageRange && (
                <span className={styles.pageRange}>{documentExcerpts[0].pageRange}</span>
              )}
            </div>
            <div className={styles.excerptCard}>
              <p className={styles.excerptText}>
                &ldquo;{documentExcerpts[0].text}&rdquo;
              </p>
              <p className={styles.excerptRelevance}>{documentExcerpts[0].relevance}</p>
              <div className={styles.excerptActions}>
                <button
                  className={styles.copyBtn}
                  onClick={() => {
                    navigator.clipboard.writeText(documentExcerpts[0].text);
                    toast.success('Excerpt copied');
                  }}
                >
                  📋 Copy Citation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Attention Items */}
        {attentionItems.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitleRed}>❗ What Deserves Immediate Attention</h3>
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

        {/* Hindi Toggle */}
        <div className={styles.hindiToggleSection}>
          <button
            className={styles.hindiToggleBtn}
            onClick={() => setShowHindi(!showHindi)}
          >
            {showHindi ? '🌐 Show English' : '🇮🇳 View in Hindi / हिंदी में देखें'}
          </button>
          {showHindi && hindiTranslation && (
            <div className={styles.hindiContent}>
              <p className={styles.hindiSummary} lang="hi">{hindiTranslation.summaryHindi}</p>
              {hindiTranslation.deadlineHindi && (
                <p className={styles.hindiDeadline} lang="hi">⏰ {hindiTranslation.deadlineHindi}</p>
              )}
              {hindiTranslation.attentionItemsHindi.map((item, i) => (
                <div key={i} className={styles.hindiItem}>
                  <p className={styles.hindiItemTitle} lang="hi">{item.title}</p>
                  <p className={styles.hindiItemDesc} lang="hi">{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA to Questions */}
        <button
          id="review-questions-btn"
          className={styles.questionsBtn}
          onClick={() => router.push(`/questions?analysisId=${analysisId}`)}
        >
          Review {lawyerQuestions.length} Lawyer Questions →
        </button>

        {/* Legal Help */}
        {legalHelpResources.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>⚖️ FREE LEGAL HELP RESOURCES</h3>
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
          <p className={styles.safetyText}>{analysis.safetyDisclaimer}</p>
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
