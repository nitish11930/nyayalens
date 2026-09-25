'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { NyayaUser } from '@/types';

// ─── Demo Credentials (hardcoded — no Firebase, no cost) ───────────────────
export const DEMO_EMAIL = 'demo@nyayalens.in';
export const DEMO_PASSWORD = 'Demo@1234';
const DEMO_UID = 'demo-user-nyayalens-hackathon';

const DEMO_USER: NyayaUser = {
  uid: DEMO_UID,
  email: DEMO_EMAIL,
  displayName: 'Demo Citizen',
  photoURL: null,
  createdAt: new Date().toISOString(),
  zeroRetentionEnabled: true,
  language: 'en',
  analysisCount: 3,
};

// A fake User-like object for the demo session (satisfies User interface minimally)
const DEMO_FIREBASE_USER = {
  uid: DEMO_UID,
  email: DEMO_EMAIL,
  displayName: 'Demo Citizen',
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  providerData: [],
  metadata: {},
  providerId: 'demo',
  tenantId: null,
  refreshToken: '',
  getIdToken: async () => 'demo-token',
  getIdTokenResult: async () => ({ token: 'demo-token' } as any),
  reload: async () => {},
  toJSON: () => ({}),
  delete: async () => {},
} as unknown as User;

const DEMO_SESSION_KEY = 'nyayalens_demo_session';

// ─── Context Types ──────────────────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  nyayaUser: NyayaUser | null;
  loading: boolean;
  firebaseReady: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInDemo: () => Promise<void>;
  signUp: (email: string, password: string, displayName: string, zeroRetention: boolean) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [nyayaUser, setNyayaUser] = useState<NyayaUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // 1. Check for demo session first
    if (typeof window !== 'undefined') {
      const demoSession = localStorage.getItem(DEMO_SESSION_KEY);
      if (demoSession === 'active') {
        setUser(DEMO_FIREBASE_USER);
        setNyayaUser(DEMO_USER);
        setIsDemoMode(true);
        setLoading(false);
        return; // Skip Firebase auth
      }
    }

    // 2. Otherwise init Firebase auth
    let unsubscribe: (() => void) | undefined;

    const initFirebase = async () => {
      try {
        const { getAuth, onAuthStateChanged } = await import('firebase/auth');
        const { getFirebaseApp } = await import('@/lib/firebase');

        const app = getFirebaseApp();
        const auth = getAuth(app);
        setFirebaseReady(true);

        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          setUser(firebaseUser);
          if (firebaseUser) {
            await fetchOrCreateUserProfile(firebaseUser);
          } else {
            setNyayaUser(null);
          }
          setLoading(false);
        });
      } catch (e) {
        console.warn('[AuthContext] Firebase not configured:', e);
        setFirebaseReady(false);
        setLoading(false);
      }
    };

    initFirebase();
    return () => unsubscribe?.();
  }, []);

  const fetchOrCreateUserProfile = async (firebaseUser: User) => {
    try {
      const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { getFirebaseDb } = await import('@/lib/firebase');
      const db = getFirebaseDb();
      const userRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        setNyayaUser(snap.data() as NyayaUser);
      } else {
        const newUser: NyayaUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || 'Citizen',
          photoURL: firebaseUser.photoURL,
          createdAt: new Date().toISOString(),
          zeroRetentionEnabled: true,
          language: 'en',
          analysisCount: 0,
        };
        await setDoc(userRef, { ...newUser, createdAt: serverTimestamp() });
        setNyayaUser(newUser);
      }
    } catch (e) {
      console.error('[AuthContext] Failed to fetch user profile:', e);
    }
  };

  // ─── Demo Login (no Firebase, no cost) ─────────────────────────────────
  const signInDemo = async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEMO_SESSION_KEY, 'active');
    }
    setUser(DEMO_FIREBASE_USER);
    setNyayaUser(DEMO_USER);
    setIsDemoMode(true);
  };

  // ─── Real Firebase Auth ─────────────────────────────────────────────────
  const signIn = async (email: string, password: string) => {
    // Allow demo credentials without Firebase
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      await signInDemo();
      return;
    }
    const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
    const { getFirebaseApp } = await import('@/lib/firebase');
    const auth = getAuth(getFirebaseApp());
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName: string, _zeroRetention: boolean) => {
    const { getAuth, createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
    const { getFirebaseApp } = await import('@/lib/firebase');
    const auth = getAuth(getFirebaseApp());
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(firebaseUser, { displayName });
    await fetchOrCreateUserProfile(firebaseUser);
  };

  const signInWithGoogle = async () => {
    const { getAuth, signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
    const { getFirebaseApp } = await import('@/lib/firebase');
    const auth = getAuth(getFirebaseApp());
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await fetchOrCreateUserProfile(result.user);
  };

  const signOut = async () => {
    // Clear demo session
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DEMO_SESSION_KEY);
    }
    setIsDemoMode(false);
    setNyayaUser(null);
    setUser(null);

    // Also sign out from Firebase if it was active
    try {
      const { getAuth, signOut: firebaseSignOut } = await import('firebase/auth');
      const { getFirebaseApp } = await import('@/lib/firebase');
      const auth = getAuth(getFirebaseApp());
      await firebaseSignOut(auth);
    } catch {
      // Ignore — demo mode doesn't have Firebase session
    }
  };

  const resetPassword = async (email: string) => {
    const { getAuth, sendPasswordResetEmail } = await import('firebase/auth');
    const { getFirebaseApp } = await import('@/lib/firebase');
    const auth = getAuth(getFirebaseApp());
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider
      value={{ user, nyayaUser, loading, firebaseReady, isDemoMode, signIn, signInDemo, signUp, signInWithGoogle, signOut, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
