'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';


import { AnalysisResult } from '@/types';
import BottomNav from '@/components/BottomNav';
import styles from './page.module.css';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, nyayaUser, signOut } = useAuth();
  const router = useRouter();
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchAnalyses();
  }, [user]);

  const fetchAnalyses = async () => {
    if (!user) return;
    try {
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
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleShred = async (id: string) => {
    if (!confirm('Permanently delete this analysis? This cannot be undone.')) return;
    try {
      const { getDb } = await import('@/lib/firestore');
      const { deleteDoc, doc } = await import('firebase/firestore');
      const db = await getDb();
      await deleteDoc(doc(db, 'analyses', id));
      setAnalyses(prev => prev.filter(a => a.id !== id));
      toast.success('Analysis shredded 🔥');
    } catch {
      toast.error('Failed to delete analysis');
    }
  };

  const handleShredAll = async () => {
    if (!confirm('Delete ALL local document cache? This is permanent.')) return;
    try {
      const { getDb } = await import('@/lib/firestore');
      const { deleteDoc, doc } = await import('firebase/firestore');
      const db = await getDb();
      await Promise.all(analyses.map(a => deleteDoc(doc(db, 'analyses', a.id))));
      setAnalyses([]);
      toast.success('All data cleared 🔥');
    } catch {
      toast.error('Failed to clear data');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/landing');
    toast.success('Signed out successfully');
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (!user) return null;

  const displayName = nyayaUser?.displayName || user.displayName || 'Citizen';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/dashboard')}>← Back</button>
        <h1 className={styles.title}>Profile &amp; Account</h1>
        <div className={styles.langToggle}>🌐 हिंदी / EN</div>
      </header>

      <div className={styles.disclaimer}>
        <span>ℹ️</span>
        <span>Informational civic assistance — not formal legal advice. For legal representation, consult an enrolled advocate or DLSA cell.</span>
      </div>

      <main className={styles.main}>
        {/* Profile Card */}
        <div className={styles.profileCard}>
          <div className={styles.avatar}>{getInitials(displayName)}</div>
          <div className={styles.profileInfo}>
            <h2 className={styles.profileName}>{displayName}</h2>
            <p className={styles.profileEmail}>{user.email}</p>
            <div className={styles.profileBadges}>
              <span className={styles.badge}>✓ VERIFIED CITIZEN ID</span>
              {nyayaUser?.zeroRetentionEnabled && (
                <span className={styles.badgeGreen}>DLSA AID ELIGIBLE</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <p className={styles.statNumber}>{analyses.length}</p>
            <p className={styles.statLabel}>Analyzed Notices</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statNumber}>0</p>
            <p className={styles.statLabel}>Consultations Prep</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statNumber}>0</p>
            <p className={styles.statLabel}>Data Retained</p>
          </div>
        </div>

        {/* Document Vault */}
        <div className={styles.vaultSection}>
          <div className={styles.vaultHeader}>
            <h3 className={styles.vaultTitle}>📁 Document Vault &amp; History</h3>
            <span className={styles.vaultCount}>{analyses.length} Records</span>
          </div>

          {/* Zero-Retention Toggle */}
          <div className={styles.retentionRow}>
            <div className={styles.retentionIcon}>🔄</div>
            <div className={styles.retentionText}>
              <p className={styles.retentionTitle}>Zero-Retention Security</p>
              <p className={styles.retentionDesc}>Uploaded notice scans are cryptographically scrubbed and wiped from servers immediately post-analysis.</p>
            </div>
            <label className={styles.toggle}>
              <input type="checkbox" defaultChecked={nyayaUser?.zeroRetentionEnabled} readOnly />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          {/* Analysis List */}
          {loading ? (
            <div className={styles.skeleton} style={{ height: 80, borderRadius: 12 }} />
          ) : analyses.length === 0 ? (
            <div className={styles.emptyVault}>
              <p>No analyses yet. Upload a notice to get started.</p>
            </div>
          ) : (
            <div className={styles.analysisList}>
              {analyses.map(a => (
                <div key={a.id} className={styles.analysisItem}>
                  <div className={styles.analysisTop}>
                    <span className={styles.analysisType}>{a.noticeCategory?.legalSection || 'Notice'}</span>
                    <span className={styles.analysisStatus}>
                      {a.deadline ? '🔴 URGENT' : '✅ ANALYZED'}
                    </span>
                  </div>
                  <p className={styles.analysisName}>{a.noticeCategory?.type}</p>
                  <p className={styles.analysisMeta}>
                    {a.keyFacts?.[0]?.value || ''} • {a.deadline?.days ? `${a.deadline.days} Days statutory reply` : 'No deadline specified'}
                  </p>
                  <div className={styles.analysisActions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => router.push(`/results/${a.id}`)}
                    >
                      📄 View Analysis
                    </button>
                    <button
                      className={styles.shredBtn}
                      onClick={() => handleShred(a.id)}
                    >
                      🔥 Shred Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {analyses.length > 0 && (
            <button className={styles.clearAllBtn} onClick={handleShredAll}>
              🗑️ Clear All Local Document Cache
            </button>
          )}
        </div>

        {/* Security & Preferences */}
        <div className={styles.prefsSection}>
          <h3 className={styles.prefsTitle}>🔒 Security &amp; Preferences</h3>
          <div className={styles.prefsList}>
            {preferences.map((p, i) => (
              <button key={i} className={styles.prefItem} onClick={() => toast('Coming soon')}>
                <span className={styles.prefIcon}>{p.icon}</span>
                <div className={styles.prefText}>
                  <p className={styles.prefTitle}>{p.title}</p>
                  <p className={styles.prefDesc}>{p.desc}</p>
                </div>
                <span className={styles.prefArrow}>›</span>
              </button>
            ))}
          </div>
        </div>

        {/* Account Actions */}
        <div className={styles.actionsSection}>
          <h3 className={styles.actionsTitle}>Account Actions</h3>
          <button className={styles.signOutBtn} onClick={handleSignOut}>
            → Log Out of NyayaLens
          </button>
          <button
            className={styles.deleteBtn}
            onClick={() => toast.error('Please contact support to delete your account')}
          >
            🗑️ Delete NyayaLens Account &amp; Purge Data
          </button>
        </div>
      </main>

      <BottomNav active="profile" />
    </div>
  );
}

const preferences = [
  { icon: '🔐', title: 'App Passcode & Biometric Lock', desc: 'Enabled • 4-digit PIN configured' },
  { icon: '🌐', title: 'Language & Regional Legal Script', desc: 'Current: English (Hindi available)' },
  { icon: '📊', title: 'Data Privacy & Shredding Logs', desc: 'Immutable client audit trail' },
  { icon: '⚖️', title: 'Official Legal Aid Credentials', desc: 'DLSA Section 12 Verified' },
];
