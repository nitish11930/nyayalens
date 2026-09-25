'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';


import { AnalysisResult } from '@/types';
import BottomNav from '@/components/BottomNav';
import styles from './page.module.css';

export default function NoticesPage() {
  const { user, isDemoMode } = useAuth();
  const router = useRouter();
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'urgent' | 'ready'>('all');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchAnalyses();
  }, [user]);

  const fetchAnalyses = async () => {
    if (!user) return;
    try {
      if (isDemoMode) {
        const keys = Object.keys(sessionStorage).filter(k => k.startsWith('nyayalens_demo_result_'));
        const mockAnalyses = keys.map(k => JSON.parse(sessionStorage.getItem(k)!));
        setAnalyses(mockAnalyses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        return;
      }
      const { getDb } = await import('@/lib/firestore');
      const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
      const db = await getDb();
      const q = query(
        collection(db, 'analyses'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setAnalyses(snap.docs.map(d => ({ id: d.id, ...d.data() } as AnalysisResult)));
    } catch (e) {
      console.error('Fetch notices error:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = analyses.filter(a => {
    if (filter === 'urgent') return a.deadline?.isCrucial;
    if (filter === 'ready') return a.status === 'ready';
    return true;
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/dashboard')}>← Back</button>
        <h1 className={styles.title}>My Notices</h1>
        <button className={styles.addBtn} onClick={() => router.push('/analyze')}>+ New</button>
      </header>

      <div className={styles.disclaimer}>
        <span>🛡️</span>
        <span>Informational civic assistance — not formal legal advice.</span>
      </div>

      <main className={styles.main}>
        {/* Filter Tabs */}
        <div className={styles.filterTabs}>
          {(['all', 'urgent', 'ready'] as const).map(f => (
            <button
              key={f}
              className={`${styles.filterTab} ${filter === f ? styles.filterActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? `All (${analyses.length})` : f === 'urgent' ? `⚠️ Urgent` : `✅ Ready`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.loadingList}>
            {[1, 2, 3].map(i => <div key={i} className={`${styles.skeleton} ${styles.skeletonCard}`} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyIcon}>📋</p>
            <h2>{analyses.length === 0 ? 'No notices analyzed yet' : 'No notices match this filter'}</h2>
            <p>{analyses.length === 0 ? 'Upload a legal notice to get started.' : 'Try selecting a different filter.'}</p>
            {analyses.length === 0 && (
              <button className={styles.emptyBtn} onClick={() => router.push('/analyze')}>
                Analyze First Notice →
              </button>
            )}
          </div>
        ) : (
          <div className={styles.list}>
            {filtered.map(a => (
              <div
                key={a.id}
                className={styles.noticeCard}
                onClick={() => router.push(`/results/${a.id}`)}
              >
                <div className={styles.noticeIconBox} style={{ background: a.deadline?.isCrucial ? '#fee2e2' : '#e0e7ff' }}>
                  {a.deadline?.isCrucial ? '⚠️' : '📄'}
                </div>
                <div className={styles.noticeBody}>
                  <div className={styles.noticeTopRow}>
                    <p className={styles.noticeTitle}>{a.noticeCategory?.type || 'Legal Notice'}</p>
                    {a.deadline && (
                      <span className={styles.timerBadge}>{a.deadline.days}-DAY {a.deadline.unit.toUpperCase()}</span>
                    )}
                  </div>
                  <p className={styles.noticeSummary}>{a.plainEnglishSummary?.slice(0, 100)}...</p>
                  <div className={styles.noticeMeta}>
                    <span className={styles.noticeDate}>{new Date(a.createdAt).toLocaleDateString('en-IN')}</span>
                    <span className={styles.noticeStatus}>
                      {a.status === 'ready' ? '✅ Ready' : a.status}
                    </span>
                  </div>
                </div>
                <span className={styles.arrow}>›</span>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav active="notices" />
    </div>
  );
}
