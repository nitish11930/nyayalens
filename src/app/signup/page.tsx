'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import styles from '../login/page.module.css';

export default function SignupPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [zeroRetention, setZeroRetention] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const passwordStrength = (p: string) => {
    let score = 0;
    if (p.length >= 8) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^a-zA-Z0-9]/.test(p)) score++;
    if (p.length >= 12) score++;
    return score;
  };

  const strength = passwordStrength(password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong', 'Very Strong'][strength] || '';
  const strengthColor = ['', '#ef4444', '#f59e0b', '#10b981', '#10b981'][strength] || '#e5e7eb';

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (!acceptedTerms) {
      toast.error('Please accept the terms to continue');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, fullName, zeroRetention);
      toast.success('Account created! Welcome to NyayaLens.');
      router.push('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/email-already-in-use') {
        toast.error('An account with this email already exists');
      } else if (code === 'auth/weak-password') {
        toast.error('Password is too weak. Use at least 8 characters.');
      } else {
        toast.error('Sign up failed. Please try again.');
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

  return (
    <div className={styles.page}>
      <div className={styles.statusBar}>
        <span>NyayaLens v1.0 (Citizen Edition)</span>
        <span>IT Act Sec 43A Compliant</span>
        <span>Zero-Retention</span>
      </div>

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

      <div className={styles.disclaimerBar}>
        <span>🛡️</span>
        <span>Informational civic assistance — not formal legal advice.</span>
      </div>

      <main className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.title}>Create Citizen Account</h1>
          <p className={styles.titleHindi} lang="hi">नया नागरिक खाता बनाएं</p>
          <p className={styles.subtitle}>
            Join NyayaLens to translate complex legal notices, extract statutory timelines, 
            and securely prepare consultation briefs for advocates.
          </p>

          <form onSubmit={handleSignUp} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Full Legal Name (as per ID)
                <span style={{ color: '#6b7280', fontWeight: 400, fontSize: '0.75rem' }}>OFFICIAL ID</span>
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>👤</span>
                <input
                  id="signup-name"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Full Name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Email or +91 Mobile Number
                <span style={{ color: '#6b7280', fontWeight: 400, fontSize: '0.75rem' }}>SECURE OTP</span>
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>📧</span>
                <input
                  id="signup-email"
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
                Create Password
                <span style={{ color: '#6b7280', fontWeight: 400, fontSize: '0.75rem' }}>AES-256</span>
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>🔒</span>
                <input
                  id="signup-password"
                  type={showPass ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="••••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {/* Password strength meter */}
              {password && (
                <div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 4,
                        background: i <= strength ? strengthColor : '#e5e7eb',
                        transition: 'background 0.3s',
                      }} />
                    ))}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: strengthColor, marginTop: 4, fontWeight: 600 }}>
                    {strengthLabel} — 8+ chars, 1 number & symbol recommended
                  </p>
                </div>
              )}
            </div>

            <label className={styles.checkboxGroup}>
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={e => setAcceptedTerms(e.target.checked)}
                required
              />
              <span style={{ fontSize: '0.82rem', color: '#374151' }}>
                I understand NyayaLens provides <strong>informational civic assistance</strong> and 
                does not constitute formal legal counsel or advocate representation.
              </span>
            </label>

            <label className={styles.checkboxGroup}>
              <input
                type="checkbox"
                checked={zeroRetention}
                onChange={e => setZeroRetention(e.target.checked)}
              />
              <span style={{ fontSize: '0.82rem', color: '#374151' }}>
                <strong>Enable Zero-Retention Enclave</strong>{' '}
                <span style={{
                  background: '#d1fae5', color: '#065f46',
                  fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px',
                  borderRadius: 4, letterSpacing: '0.05em'
                }}>RECOMMENDED</span>
                <br />
                <span style={{ color: '#6b7280' }}>
                  Notice files are wiped completely from compute memory post-analysis.
                </span>
              </span>
            </label>

            <button
              id="signup-submit"
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <><span className={styles.spinner} /> Creating Account...</>
              ) : (
                <>👤 Create Free Account / <span lang="hi">खाता बनाएं</span></>
              )}
            </button>
          </form>

          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>OR SIGN UP WITH</span>
            <span className={styles.dividerLine} />
          </div>

          <div className={styles.socialBtns}>
            <button className={styles.socialBtn} disabled>
              <span className={styles.socialIcon}>🪪</span>
              <div className={styles.socialText}>
                <span className={styles.socialTitle}>DigiLocker / Aadhaar</span>
                <span className={styles.socialSub}>Instant Sec. 12 DLSA Eligibility Check</span>
              </div>
              <span style={{
                background: '#d1fae5', color: '#065f46',
                fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px',
                borderRadius: 4
              }}>VERIFIED</span>
            </button>

            <button
              id="google-signup"
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
                {googleLoading ? 'Signing up...' : 'Continue with Google'}
              </span>
            </button>
          </div>

          <div className={styles.privacyNote}>
            <span>🔐</span>
            <div>
              <p className={styles.privacyTitle}>End-to-End Client Security</p>
              <p className={styles.privacyDesc}>
                We never sell your legal dispute data, train commercial LLMs on your notices, 
                or share case papers without your express consent.
              </p>
            </div>
          </div>
        </div>

        <p className={styles.footerLink}>
          Already have an account?{' '}
          <button onClick={() => router.push('/login')} className={styles.textLink}>
            Sign in / <span lang="hi">लॉगिन करें</span>
          </button>
        </p>
      </main>
    </div>
  );
}
