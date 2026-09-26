'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AnalysisResult } from '@/types';
import BottomNav from '@/components/BottomNav';
import styles from './page.module.css';

export default function DashboardPage() {
  const { user, nyayaUser, loading, signOut, isDemoMode } = useAuth();
  const router = useRouter();
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisResult[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [showNotifs, setShowNotifs] = useState(false);
  const [lang, setLang] = useState<'EN' | 'HI'>('EN');

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchRecentAnalyses();
    }
  }, [user]);

  const fetchRecentAnalyses = async () => {
    if (!user) return;
    try {
      if (isDemoMode) {
        const keys = Object.keys(sessionStorage).filter(k => k.startsWith('nyayalens_demo_result_'));
        const mockAnalyses = keys.map(k => JSON.parse(sessionStorage.getItem(k)!));
        setRecentAnalyses(mockAnalyses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5));
        return;
      }
      const { getDb } = await import('@/lib/firestore');
      const { collection, query, where, orderBy, limit, getDocs } = await import('firebase/firestore');
      const db = await getDb();
      const q = query(
        collection(db, 'analyses'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as AnalysisResult));
      setRecentAnalyses(docs);
    } catch (e) {
      console.error('Failed to load analyses', e);
    } finally {
      setLoadingDocs(false);
    }
  };

  const getTimeOfDay = () => {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  };

  const getFirstName = () => {
    const name = nyayaUser?.displayName || user?.displayName || 'Citizen';
    return name.split(' ')[0];
  };

  if (loading) return null;
  if (!user) return null;

  return (
    <div className={styles.page}>
      {/* Demo mode banner */}
      {isDemoMode && (
        <div style={{
          background: 'linear-gradient(90deg, #f59e0b, #d97706)',
          color: 'white',
          textAlign: 'center',
          fontSize: '0.72rem',
          fontWeight: 700,
          padding: '6px 16px',
          letterSpacing: '0.05em'
        }}>
          🎭 DEMO MODE &nbsp;·&nbsp; demo@nyayalens.in &nbsp;·&nbsp; No data is saved
        </div>
      )}
      {/* Top Nav */}
      <header className={styles.topNav}>
        <div className={styles.navBrand}>
          <div className={styles.navIcon}>⚖️</div>
          <div>
            <span className={styles.navTitle}>NyayaLens</span>
            <span className={styles.navSub}>LEGAL INTELLIGENCE</span>
          </div>
        </div>
        <div className={styles.navRight}>
          <button 
            className={styles.langBtn}
            onClick={() => {
              setLang(prev => prev === 'EN' ? 'HI' : 'EN');
              toast.success(`Language switched to ${lang === 'EN' ? 'Hindi' : 'English'}`);
            }}
          >
            🌐 {lang === 'EN' ? 'हिंदी' : 'English'}
          </button>
          
          <div className={styles.notifWrapper} style={{ position: 'relative' }}>
            <div 
              className={styles.notifBtn} 
              onClick={() => setShowNotifs(!showNotifs)}
              style={{ cursor: 'pointer' }}
            >
              🔔 <span className={styles.notifDot} />
            </div>
            
            {showNotifs && (
              <div style={{
                position: 'absolute',
                top: '40px',
                right: '0',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                width: '280px',
                zIndex: 50,
                padding: '12px'
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1e293b' }}>Notifications</h4>
                <div style={{ fontSize: '13px', color: '#475569', marginBottom: '8px', padding: '8px', background: '#f8fafc', borderRadius: '4px' }}>
                  <strong style={{ color: '#4f46e5', display: 'block' }}>Welcome to NyayaLens</strong>
                  You are in Demo Mode. Try uploading a legal notice!
                </div>
                <div style={{ fontSize: '13px', color: '#475569', padding: '8px', background: '#f8fafc', borderRadius: '4px' }}>
                  <strong style={{ color: '#10b981', display: 'block' }}>System Update</strong>
                  Hindi translation is now active for analysis results.
                </div>
              </div>
            )}
          </div>

          <button
            className={styles.avatarBtn}
            onClick={() => router.push('/profile')}
          >
            {getFirstName().slice(0, 2).toUpperCase()}
          </button>
        </div>
      </header>

      {/* Disclaimer */}
      <div className={styles.disclaimer}>
        <span>🛡️</span>
        <span>Informational civic assistance — not formal legal advice.</span>
      </div>

      {/* Content */}
      <main className={styles.main}>
        {/* Greeting */}
        <div className={styles.greeting}>
          <p className={styles.greetingLabel}>
            {lang === 'EN' ? 'AUTHORIZED CITIZEN PORTAL' : 'अधिकृत नागरिक पोर्टल'}
          </p>
          <h1 className={styles.greetingTitle}>
            {lang === 'EN' ? `Good ${getTimeOfDay()}, ${getFirstName()}` : `नमस्ते, ${getFirstName()}`}
          </h1>
          <p className={styles.greetingDesc}>
            {lang === 'EN' ? 'What do you need legal clarity with today?' : 'आज आपको किस कानूनी मामले में स्पष्टता चाहिए?'}
          </p>
        </div>

        {/* Hero Banner */}
        <div className={styles.heroBanner}>
          <div className={styles.heroBadge}>
            ✨ Cheque Bounce, Demand & Tenancy supported
          </div>
          <h2 className={styles.heroTitle}>Notice Translation &amp; Risk Audit</h2>
          <p className={styles.heroDesc}>
            Instant breakdown into everyday conversational language with 
            customized lawyer questions.
          </p>
          <button
            id="analyze-new-notice-btn"
            className={styles.heroBtn}
            onClick={() => router.push('/analyze')}
          >
            ⊕ Analyze New Legal Notice
          </button>
        </div>

        {/* Fast Tools */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>FAST TOOLS</h2>
          <div className={styles.fastTools}>
            <button className={styles.fastTool} onClick={() => router.push('/analyze')}>
              <span className={styles.fastToolIcon}>📤</span>
              <span>Analyze Doc</span>
            </button>
            <button className={styles.fastTool} onClick={() => router.push('/questions')}>
              <span className={styles.fastToolIcon}>❓</span>
              <span>5 Questions</span>
            </button>
            <button className={styles.fastTool} onClick={() => router.push('/legal-help')}>
              <span className={styles.fastToolIcon}>🏛️</span>
              <span>DLSA Aid</span>
            </button>
          </div>
        </section>

        {/* Recent Notices */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Notices</h2>
            <button
              className={styles.viewAllBtn}
              onClick={() => router.push('/notices')}
            >
              View all ({recentAnalyses.length}) ›
            </button>
          </div>

          {loadingDocs ? (
            <div className={styles.loadingCards}>
              {[1, 2].map(i => (
                <div key={i} className={`${styles.skeleton} ${styles.skeletonCard}`} />
              ))}
            </div>
          ) : recentAnalyses.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyIcon}>📋</p>
              <p className={styles.emptyTitle}>No notices analyzed yet</p>
              <p className={styles.emptyDesc}>Upload your first legal notice to get started</p>
              <button
                className={styles.emptyBtn}
                onClick={() => router.push('/analyze')}
              >
                Analyze First Notice →
              </button>
            </div>
          ) : (
            <div className={styles.noticeList}>
              {recentAnalyses.map(analysis => (
                <NoticeCard
                  key={analysis.id}
                  analysis={analysis}
                  onClick={() => router.push(`/results/${analysis.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Zero Retention Banner */}
        <div className={styles.zeroBanner}>
          <span>🔐</span>
          <div>
            <p className={styles.zeroTitle}>Zero-Retention Confidentiality</p>
            <p className={styles.zeroDesc}>
              Your files are shredded automatically post-extraction. 
              No citizen document is trained on public AI models.
            </p>
          </div>
        </div>
      </main>

      {/* FAB */}
      <button
        id="fab-analyze"
        className={styles.fab}
        onClick={() => router.push('/analyze')}
      >
        📋 Analyze Notice
      </button>

      <BottomNav active="home" />
    </div>
  );
}

function NoticeCard({ analysis, onClick }: { analysis: AnalysisResult; onClick: () => void }) {
  const isUrgent = analysis.deadline && analysis.deadline.isCrucial;
  const timeAgo = getTimeAgo(analysis.createdAt);

  return (
    <button className={styles.noticeCard} onClick={onClick}>
      <div className={styles.noticeIcon} style={{
        background: isUrgent ? '#fee2e2' : '#e0e7ff'
      }}>
        {isUrgent ? '⚠️' : '📄'}
      </div>
      <div className={styles.noticeInfo}>
        <div className={styles.noticeTopRow}>
          <p className={styles.noticeName}>{analysis.noticeCategory?.type || 'Legal Notice'}</p>
          {analysis.deadline && (
            <span className={styles.timerBadge}>
              {analysis.deadline.days}-DAY {(analysis.deadline.unit || 'days').toUpperCase()}
            </span>
          )}
        </div>
        <p className={styles.noticeDesc}>
          {analysis.plainEnglishSummary?.slice(0, 80)}...
        </p>
        <div className={styles.noticeMeta}>
          <span>⏱ {timeAgo}</span>
          <span style={{ color: '#10b981' }}>✅ {analysis.status === 'ready' ? 'Ready' : analysis.status}</span>
        </div>
      </div>
      <span className={styles.noticeArrow}>›</span>
    </button>
  );
}

function getTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 2) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}
