'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UploadState } from '@/types';
import toast from 'react-hot-toast';
import BottomNav from '@/components/BottomNav';
import styles from './page.module.css';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export default function AnalyzePage() {
  const { user, isDemoMode } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle', progress: 0 });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only PDF, JPEG, PNG, or WebP files are supported';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is 10MB (your file: ${(file.size / 1024 / 1024).toFixed(1)}MB)`;
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    setSelectedFile(file);
    setUploadState({ status: 'idle', progress: 0 });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleAnalyze = async () => {
    if (!selectedFile || !user) return;

    const documentId = uuidv4();

    try {
      // ── DEMO MODE: Skip Firebase Storage, send base64 directly ──────────
      if (isDemoMode) {
        setUploadState({ status: 'uploading', progress: 30 });

        const fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Strip data URL prefix (data:application/pdf;base64,...)
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        setUploadState({ status: 'analyzing', progress: 100 });

        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64,
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            userId: user.uid,
            documentId,
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Analysis failed');
        }

        const data = await response.json();

        // Demo: save result in sessionStorage (no Firestore)
        if (data.analysis) {
          sessionStorage.setItem(`nyayalens_demo_result_${documentId}`, JSON.stringify(data.analysis));
        }

        setUploadState({ status: 'complete', progress: 100, analysisId: data.analysisId });
        toast.success('Analysis complete!');
        router.push(`/results/${data.analysisId}`);
        return;
      }

      // ── REAL MODE: Upload to Firebase Storage ───────────────────────────
      const fileExt = selectedFile.name.split('.').pop() || 'pdf';
      const storagePath = `users/${user.uid}/notices/${documentId}.${fileExt}`;

      setUploadState({ status: 'uploading', progress: 0 });

      const { getFirebaseStorage } = await import('@/lib/firebase');
      const { ref, uploadBytesResumable, getDownloadURL, deleteObject } = await import('firebase/storage');
      const storage = getFirebaseStorage();

      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      const fileUrl = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadState({ status: 'uploading', progress });
          },
          (error) => reject(error),
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });

      setUploadState({ status: 'analyzing', progress: 100 });

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          userId: user.uid,
          documentId,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Analysis failed');
      }

      const data = await response.json();

      // Zero-retention: delete file from Storage after analysis
      try {
        await deleteObject(storageRef);
      } catch {
        // Non-fatal
      }

      setUploadState({ status: 'complete', progress: 100, analysisId: data.analysisId });
      toast.success('Analysis complete!');
      router.push(`/results/${data.analysisId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setUploadState({ status: 'error', progress: 0, error: message });
      toast.error(message);
    }
  };

  const getStatusMessage = () => {
    switch (uploadState.status) {
      case 'validating': return '🔍 Validating document...';
      case 'uploading': return `📤 Uploading... ${Math.round(uploadState.progress)}%`;
      case 'analyzing': return '🤖 Gemini is analyzing your notice...';
      case 'complete': return '✅ Analysis complete! Redirecting...';
      case 'error': return `❌ ${uploadState.error}`;
      default: return '';
    }
  };

  const isProcessing = ['validating', 'uploading', 'analyzing'].includes(uploadState.status);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/dashboard')}>← Back</button>
        <h1 className={styles.title}>Analyze Notice</h1>
        <div className={styles.langToggle}>🌐 हिंदी / EN</div>
      </header>

      <div className={styles.disclaimer}>
        <span>🛡️</span>
        <span>Informational assistance — not formal legal advice.</span>
      </div>

      <main className={styles.main}>
        {/* Instructions */}
        <div className={styles.infoCard}>
          <p className={styles.infoTitle}>📋 How it works</p>
          <ol className={styles.infoSteps}>
            <li>Upload your legal notice (PDF or image)</li>
            <li>Gemini AI reads and extracts all key facts</li>
            <li>Get a plain-language breakdown in 30–60 seconds</li>
            <li>Review deadlines, attention items, and lawyer questions</li>
          </ol>
        </div>

        {/* Upload Zone */}
        <div
          className={`${styles.uploadZone} ${dragOver ? styles.dragOver : ''} ${selectedFile ? styles.hasFile : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className={styles.fileInput}
            disabled={isProcessing}
          />

          {selectedFile ? (
            <div className={styles.filePreview}>
              <div className={styles.fileIcon}>
                {selectedFile.type === 'application/pdf' ? '📄' : '🖼️'}
              </div>
              <div className={styles.fileInfo}>
                <p className={styles.fileName}>{selectedFile.name}</p>
                <p className={styles.fileSize}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              {!isProcessing && (
                <button
                  className={styles.removeBtn}
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                >✕</button>
              )}
            </div>
          ) : (
            <div className={styles.uploadPrompt}>
              <div className={styles.uploadIcon}>📤</div>
              <p className={styles.uploadTitle}>Drop your legal notice here</p>
              <p className={styles.uploadSub}>or tap to browse files</p>
              <p className={styles.uploadTypes}>PDF, JPEG, PNG, WebP — max 10MB</p>
            </div>
          )}
        </div>

        {/* Progress */}
        {isProcessing && (
          <div className={styles.progressArea}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${uploadState.status === 'analyzing' ? 100 : uploadState.progress}%` }}
              />
            </div>
            {uploadState.status === 'analyzing' && (
              <div className={styles.analyzeAnimation}>
                <div className={styles.analyzeSpinner} />
              </div>
            )}
          </div>
        )}

        {/* Status Message */}
        {uploadState.status !== 'idle' && (
          <p className={`${styles.statusMsg} ${uploadState.status === 'error' ? styles.errorMsg : ''}`}>
            {getStatusMessage()}
          </p>
        )}

        {/* Safety Note */}
        <div className={styles.safetyNote}>
          <span>🔐</span>
          <p>
            Your document is uploaded securely, analyzed by Gemini, then <strong>permanently deleted</strong> from 
            servers. The extracted analysis is stored locally only.
          </p>
        </div>

        {/* Analyze Button */}
        <button
          id="analyze-btn"
          className={styles.analyzeBtn}
          onClick={handleAnalyze}
          disabled={!selectedFile || isProcessing}
        >
          {isProcessing ? (
            <><span className={styles.spinner} /> {uploadState.status === 'analyzing' ? 'Analyzing with Gemini...' : 'Uploading...'}</>
          ) : (
            <>🔍 Analyze This Notice</>
          )}
        </button>

        {/* Supported Notices */}
        <div className={styles.supportedTypes}>
          <p className={styles.supportedLabel}>Works with these Indian legal notices:</p>
          <div className={styles.typeGrid}>
            {supportedTypes.map((t, i) => (
              <span key={i} className={styles.typeChip}>{t}</span>
            ))}
          </div>
        </div>
      </main>

      <BottomNav active="analyze" />
    </div>
  );
}

const supportedTypes = [
  '📋 Section 138 NI Act', '🏠 Tenancy / Eviction', '💰 Money Recovery',
  '📢 Defamation', '🏢 Consumer Dispute', '👔 Employment',
  '🏗️ Property Dispute', '👨‍👩‍👧 Family Law',
];
