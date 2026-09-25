'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AnalysisResult, LawyerQuestion } from '@/types';
import BottomNav from '@/components/BottomNav';
import styles from './page.module.css';
import toast from 'react-hot-toast';
import { Suspense } from 'react';


function QuestionsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get('analysisId');

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (analysisId) fetchAnalysis();
    else setLoading(false);
  }, [user, analysisId]);

  const fetchAnalysis = async () => {
    try {
      const { getDb } = await import('@/lib/firestore');
      const { doc, getDoc } = await import('firebase/firestore');
      const db = await getDb();
      const snap = await getDoc(doc(db, 'analyses', analysisId!));
      if (snap.exists()) setAnalysis({ id: snap.id, ...snap.data() } as AnalysisResult);
    } catch (e) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
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
        <h1 className={styles.title}>Lawyer Questions</h1>
        <div className={styles.langToggle}>🌐 हिंदी / EN</div>
      </header>

      <div className={styles.disclaimer}>
        <span>ℹ️</span>
        <span>Questions are based on your document only — not general legal advice.</span>
      </div>

      <main className={styles.main}>
        {!analysis ? (
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
              <p className={styles.introLabel}>BASED ON YOUR DOCUMENT</p>
              <h2 className={styles.introTitle}>{analysis.noticeCategory?.type}</h2>
              <p className={styles.introDesc}>
                These {analysis.lawyerQuestions.length} questions are generated specifically from the content 
                of your notice. Bring them to your lawyer consultation.
              </p>
            </div>

            <div className={styles.questionsList}>
              {analysis.lawyerQuestions
                .sort((a, b) => a.order - b.order)
                .map((q, i) => (
                  <QuestionCard
                    key={i}
                    question={q}
                    index={i + 1}
                    expanded={expandedQ === i}
                    onToggle={() => setExpandedQ(expandedQ === i ? null : i)}
                  />
                ))}
            </div>

            <div className={styles.exportCard}>
              <p className={styles.exportTitle}>📋 Save for Your Consultation</p>
              <p className={styles.exportDesc}>Print or share these questions before meeting your advocate.</p>
              <button
                className={styles.exportBtn}
                onClick={() => {
                  const text = analysis.lawyerQuestions
                    .map((q, i) => `${i + 1}. ${q.question}\n   Context: ${q.context}`)
                    .join('\n\n');
                  navigator.clipboard.writeText(text);
                  toast.success('Questions copied to clipboard!');
                }}
              >
                📋 Copy All Questions
              </button>
            </div>

            {/* Hindi Questions */}
            {analysis.hindiTranslation?.attentionItemsHindi && (
              <div className={styles.hindiSection}>
                <p className={styles.hindiLabel} lang="hi">वकील से पूछने के सवाल (Hindi)</p>
                {analysis.lawyerQuestions.map((q, i) => (
                  <div key={i} className={styles.hindiQuestion}>
                    <span className={styles.hindiNum}>{i + 1}</span>
                    <p lang="hi" className={styles.hindiText}>{q.question}</p>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.dlsaCard}>
              <span>🏛️</span>
              <div>
                <p className={styles.dlsaTitle}>Need Free Legal Aid?</p>
                <p className={styles.dlsaDesc}>
                  District Legal Services Authority (DLSA) provides free legal assistance to eligible citizens.
                </p>
                <button className={styles.dlsaBtn} onClick={() => router.push('/legal-help')}>
                  Find DLSA Near You →
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

function QuestionCard({ question, index, expanded, onToggle }: {
  question: LawyerQuestion;
  index: number;
  expanded: boolean;
  onToggle: () => void;
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
          <p className={styles.contextLabel}>Why ask this:</p>
          <p className={styles.contextText}>{question.context}</p>
          {question.documentBasis && (
            <>
              <p className={styles.contextLabel}>From your document:</p>
              <p className={styles.docBasis}>"{question.documentBasis}"</p>
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
