'use client';
// Safe Firestore helpers — use dynamic imports to avoid SSR Firebase errors

import { collection, query, where, orderBy, limit, getDocs, getDoc, setDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export async function getDb() {
  const { getFirebaseApp } = await import('@/lib/firebase');
  const { getFirestore } = await import('firebase/firestore');
  return getFirestore(getFirebaseApp());
}

export async function getStorageInstance() {
  const { getFirebaseApp } = await import('@/lib/firebase');
  const { getStorage } = await import('firebase/storage');
  return getStorage(getFirebaseApp());
}

// Re-export Firestore functions for convenience
export { collection, query, where, orderBy, limit, getDocs, getDoc, setDoc, deleteDoc, doc, serverTimestamp };
