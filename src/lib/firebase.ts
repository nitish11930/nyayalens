// Firebase client-side configuration
// Only use in client components ('use client')
// Do NOT import in server components or API routes

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured =
  !!firebaseConfig.apiKey && firebaseConfig.apiKey.length > 20;

let _app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    if (!isFirebaseConfigured) {
      throw new Error(
        'Firebase not configured. Please add your Firebase credentials to .env.local. ' +
        'Copy .env.example to .env.local and fill in your Firebase project values.'
      );
    }
    _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return _app;
}

// Convenience getter — same app, used for getFirestore(getFirebaseApp()), etc.
export function getFirebaseDb() {
  const { getFirestore } = require('firebase/firestore');
  return getFirestore(getFirebaseApp());
}

export function getFirebaseStorage() {
  const { getStorage } = require('firebase/storage');
  return getStorage(getFirebaseApp());
}
