'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signInDemo } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success('Welcome back to NyayaLens!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        toast.error('Invalid email or password');
      } else if (code === 'auth/user-not-found') {
        toast.error('No account found with this email');
      } else if (code === 'auth/too-many-requests') {
        toast.error('Too many attempts. Please try again later.');
      } else {
        toast.error('Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Welcome to NyayaLens!');
      router.push('/dashboard');
    } catch {
      toast.error('Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      await signInDemo();
      toast.success('🎭 Demo mode activated! Explore freely.');
      router.push('/dashboard');
    } catch {
      toast.error('Demo login failed. Please try again.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Status Bar */}
      <div className={styles.statusBar}>
        <span>NyayaLens v1.0 (Citizen Edition)</span>
        <span>IT Act Sec 43A</span>
        <span>Zero-Retention</span>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/landing')}>
          ← Back
        </button>
        <div className={styles.brandRow}>
          <div className={styles.brandIcon}>⚖️</div>
          <span className={styles.brandName}>NyayaLens</span>
        </div>
        <div className={styles.langToggle}>🌐 हिंदी / EN</div>
      </div>

      {/* Disclaimer */}
      <div className={styles.disclaimerBar}>
        <span>🛡️</span>
        <span>Informational civic assistance — not formal legal advice.</span>
      </div>

      {/* Form Card */}
      <main className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.titleHindi} lang="hi">न्यायालेंस में पुनः स्वागत है</p>
          <p className={styles.subtitle}>
            Log in to securely review your legal notices, extracted statutory timelines, 
            and lawyer consultation notes.
          </p>

          <form onSubmit={handleSignIn} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email address or +91 Mobile Number</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>📧</span>
                <input
                  id="login-email"
                  type="email"
                  className={styles.input}
                  placeholder="e.g. citizen@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Password
                <button
                  type="button"
                  className={styles.forgotLink}
                  onClick={() => router.push('/forgot-password')}
                >
                  Forgot password?
                </button>
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>🔒</span>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <label className={styles.checkboxGroup}>
              <input type="checkbox" defaultChecked />
              <span>
                Remember this device <span className={styles.encryptionNote}>(Local Enclave Encryption)</span>
              </span>
            </label>

            <button
              id="login-submit"
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <><span className={styles.spinner} /> Signing In...</>
              ) : (
                <>🔐 Sign In to NyayaLens</>
              )}
            </button>
          </form>

          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>OR CONTINUE WITH</span>
            <span className={styles.dividerLine} />
          </div>

          {/* Social Logins */}
          <div className={styles.socialBtns}>
            <button className={styles.socialBtn} disabled>
              <span className={styles.socialIcon}>🪪</span>
              <div className={styles.socialText}>
                <span className={styles.socialTitle}>DigiLocker / Aadhaar OTP</span>
                <span className={styles.socialSub}>Govt. Verified Identity Aid</span>
              </div>
              <span className={styles.socialArrow}>›</span>
            </button>

            <button
              id="google-signin"
              className={styles.socialBtn}
              onClick={handleGoogle}
              disabled={googleLoading}
            >
              <span className={styles.socialIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </span>
              <span className={styles.socialTitle}>
                {googleLoading ? 'Signing in...' : 'Continue with Google'}
              </span>
            </button>
          </div>

          {/* Demo Banner */}
          <div className={styles.demoBanner}>
            <div className={styles.demoBannerContent}>
              <div>
                <p className={styles.demoBannerTitle}>🎭 Hackathon / Judge Demo</p>
                <p className={styles.demoBannerSub}>Instant access — no signup needed</p>
                <code className={styles.demoCreds}>{DEMO_EMAIL} &nbsp;/&nbsp; {DEMO_PASSWORD}</code>
              </div>
              <button
                id="demo-login-btn"
                className={styles.demoBannerBtn}
                onClick={handleDemo}
                disabled={demoLoading}
              >
                {demoLoading ? '⏳' : '🚀 One-Click Demo'}
              </button>
            </div>
          </div>

          {/* Privacy Note */}
          <div className={styles.privacyNote}>
            <span>🛡️</span>
            <div>
              <p className={styles.privacyTitle}>Client-Side Privacy Enclave</p>
              <p className={styles.privacyDesc}>
                Your legal dispute documents and personal queries are encrypted locally 
                and never trained on public AI.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <p className={styles.footerLink}>
          Don't have an account?{' '}
          <button onClick={() => router.push('/signup')} className={styles.textLink}>
            Create an account / <span lang="hi">नया खाता बनाएं</span>
          </button>
        </p>
        <button onClick={() => router.push('/demo')} className={styles.demoLink}>
          🧪 Want to test first? Try Demo Notice without account
        </button>
      </main>
    </div>
  );
}
