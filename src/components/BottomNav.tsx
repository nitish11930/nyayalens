'use client';

import { useRouter, usePathname } from 'next/navigation';
import styles from './BottomNav.module.css';

interface BottomNavProps {
  active: 'home' | 'notices' | 'analyze' | 'questions' | 'profile';
}

const navItems = [
  { key: 'home', label: 'Home', icon: '🏠', route: '/dashboard' },
  { key: 'notices', label: 'Notices', icon: '📄', route: '/notices' },
  { key: 'analyze', label: 'Analyze', icon: '📋', route: '/analyze', center: true },
  { key: 'questions', label: 'Questions', icon: '❓', route: '/questions' },
  { key: 'profile', label: 'Profile', icon: '👤', route: '/profile' },
];

export default function BottomNav({ active }: BottomNavProps) {
  const router = useRouter();

  return (
    <nav className={styles.nav} role="navigation" aria-label="Main navigation">
      {navItems.map(item => (
        <button
          key={item.key}
          id={`nav-${item.key}`}
          className={`${styles.navItem} ${item.center ? styles.center : ''} ${active === item.key ? styles.active : ''}`}
          onClick={() => router.push(item.route)}
          aria-label={item.label}
          aria-current={active === item.key ? 'page' : undefined}
        >
          <div className={styles.iconBg}>
            <span className={styles.icon}>{item.icon}</span>
          </div>
          <span className={styles.label}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
