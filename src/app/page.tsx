'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/landing');
      }
    }
  }, [user, loading, router]);

  return (
    <div className={styles.loadingScreen}>
      <div className={styles.logoMark}>
        <span>⚖️</span>
      </div>
      <h1 className={styles.brandName}>NyayaLens</h1>
      <p className={styles.tagline}>न्यायालेंस</p>
      <div className={styles.spinner} />
    </div>
  );
}
