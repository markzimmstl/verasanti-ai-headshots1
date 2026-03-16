import React, { useState, useEffect } from 'react';
import { auth } from '../api/base44Client';

type LoginFn = (provider: 'google' | 'email' | 'verify', credentials?: { email: string; password: string; otpCode?: string }, isSignup?: boolean) => Promise<void>;

export { AuthScreen };
export default function AuthScreen({ onLogin }: { onLogin?: LoginFn }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'verify' | 'forgot' | 'forgot-sent' | 'reset-password'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('access_token') || params.get('reset_token') || params.get('token');
    const resetParam = params.get('reset');
    if (token && (resetParam === 'true' || resetParam === '1')) {
      setResetToken(token);
      setMode('reset-password');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'verify') {
        await onLogin?.('verify' as any, { email: pendingEmail, password: pendingPassword, otpCode } as any);
      } else {
        if (mode === 'signup' && password !== confirmPassword) {
          setError('Passwords do not match.');
          setIsLoading(false);
          return;
        }
        await onLogin?.('email', { email, password }, mode === 'signup');
      }
    } catch (err: any) {
      if (err.message === 'VERIFY_EMAIL') {
        setPendingEmail(email);
        setPendingPassword(password);
        setMode('verify');
        setIsLoading(false);
        return;
      }
      setError(err.message || 'Sign-in failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const extractErrorMessage = (err: any): string => {
    if (!err) return 'Something went wrong. Please try again.';
    if (typeof err === 'string') return err;
    if (typeof err.message === 'string' && err.message) return err.message;
    if (Array.isArray(err)) return err.map((e: any) => extractErrorMessage(e)).join(' ');
    if (err.detail) return String(err.detail);
    if (err.error) return String(err.error);
    if (err.errors) return Array.isArray(err.errors) ? err.errors.map((e: any) => e.message || String(e)).join(' ') : String(err.errors);
    try { return JSON.stringify(err); } catch { return 'Something went wrong. Please try again.'; }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setIsLoading(true);
    setError(null);
    try {
      await (auth as any).resetPasswordRequest(forgotEmail);
      setMode('forgot-sent');
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmNewPassword) return;
    if (newPassword !== confirmNewPassword) { setError('Passwords do not match.'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setIsLoading(true);
    setError(null);
    try {
      await (auth as any).resetPassword({ token: resetToken, new_password: newPassword });
      setResetSuccess(true);
    } catch (err: any) {
      setError(extractErrorMessage(err) || 'Could not reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const EyeIcon = ({ visible }: { visible: boolean }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {visible ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );

  const PasswordInput = ({
    label, value, onChange, placeholder, show, onToggle, required, autoFocus,
    showMatchFeedback, matchValue,
  }: {
    label: string; value: string; onChange: (v: string) => void; placeholder: string;
    show: boolean; onToggle: () => void; required?: boolean; autoFocus?: boolean;
    showMatchFeedback?: boolean; matchValue?: string;
  }) => {
    const hasTyped = value.length > 0;
    const matches = value === matchValue;
    return (
      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>{label}</label>
        <div style={{ position: 'relative' }}>
          <input
            type={show ? 'text' : 'password'}
            className="auth-input"
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
            required={required}
            autoFocus={autoFocus}
            style={{ paddingRight: '44px' }}
          />
          <button
            type="button"
            onClick={onToggle}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', padding: '4px' }}
          >
            <EyeIcon visible={show} />
          </button>
        </div>
        {showMatchFeedback && hasTyped && (
          <p style={{ fontSize: '12px', marginTop: '6px', color: matches ? 'rgba(13,148,136,0.9)' : 'rgba(248,113,113,0.9)' }}>
            {matches ? '✓ Passwords match' : '✗ Passwords do not match'}
          </p>
        )}
      </div>
    );
  };

  const headingText = {
    login: 'Welcome back', signup: 'Create your account', verify: 'Check your email',
    forgot: 'Reset your password', 'forgot-sent': 'Check your inbox', 'reset-password': 'Set a new password',
  }[mode];

  const subText = {
    login: 'Sign in to access your credits and brand photos.',
    signup: 'Sign up to start building your brand.',
    verify: 'Enter the verification code we sent you.',
    forgot: "Enter your email and we'll send a reset link.",
    'forgot-sent': `A password reset link has been sent to ${forgotEmail}.`,
    'reset-password': 'Choose a strong new password for your account.',
  }[mode];

  return (
    <div style={{ minHeight: '100vh', background: '#080A0F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', position: 'relative', padding: '40px 24px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .auth-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 14px 16px; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 15px; outline: none; transition: all 0.2s ease; }
        .auth-input::placeholder { color: rgba(255,255,255,0.25); }
        .auth-input:focus { border-color: rgba(139, 92, 246, 0.6); background: rgba(139, 92, 246, 0.06); box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1); }
        .submit-btn { width: 100%; padding: 14px 20px; background: linear-gradient(135deg, #7C3AED, #9F67FF); border: none; border-radius: 10px; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500; cursor: pointer; transition: all 0.25s ease; letter-spacing: -0.01em; position: relative; overflow: hidden; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(124, 58, 237, 0.4); }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .mode-toggle { background: none; border: none; color: #9F67FF; font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; padding: 0; }
        .mode-toggle:hover { color: #B98FFF; }
        .noise-overlay { position: fixed; inset: 0; pointer-events: none; opacity: 0.025; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); background-size: 200px; z-index: 1; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-up-1 { animation: fadeUp 0.6s 0.1s ease both; }
        .fade-up-2 { animation: fadeUp 0.6s 0.2s ease both; }
        .fade-up-3 { animation: fadeUp 0.6s 0.3s ease both; }
        .fade-up-4 { animation: fadeUp 0.6s 0.4s ease both; }
        .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
        .sample-photo { width: 48px; height: 48px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; font-size: 18px; overflow: hidden; }
      `}</style>

      <div className="noise-overlay" />
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-20%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(ellipse, rgba(79,70,229,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ display: 'flex', width: '100%', maxWidth: '900px', minHeight: '580px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', position: 'relative', zIndex: 2 }}>

        {/* Left panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 44px', background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="fade-up-1" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #7C3AED, #9F67FF)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '700', color: '#fff', fontFamily: "'Cormorant Garamond', serif" }}>V</div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: '500', color: '#fff', letterSpacing: '0.02em' }}>VeraLooks</span>
          </div>
          <div style={{ maxWidth: '340px' }}>
            <div className="fade-up-1" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '100px', padding: '5px 12px', marginBottom: '24px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#9F67FF' }} />
              <span style={{ fontSize: '11px', color: '#B98FFF', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase' }}>AI Brand Photography</span>
            </div>
            <h1 className="fade-up-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '44px', lineHeight: '1.1', fontWeight: '400', color: '#fff', letterSpacing: '-0.02em', marginBottom: '16px' }}>
              Your brand,<br /><em style={{ color: 'rgba(159,103,255,0.9)' }}>beautifully</em><br />created.
            </h1>
            <p className="fade-up-3" style={{ fontSize: '15px', lineHeight: '1.7', color: 'rgba(255,255,255,0.45)', fontWeight: '300' }}>
              Your very own Personal Brand Image System.<br />Built by a professional photographer,<br />not a software company.
            </p>
          </div>
          <div className="fade-up-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px' }}>
              <div style={{ display: 'flex' }}>
                {['👩‍💼', '👨‍💻', '👩‍🎨', '👨‍⚕️'].map((emoji, i) => (
                  <div key={i} className="sample-photo" style={{ marginLeft: i > 0 ? '-8px' : '0', zIndex: 4 - i }}>{emoji}</div>
                ))}
              </div>
              <div>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                  {[1,2,3,4,5].map(i => <span key={i} style={{ color: '#F59E0B', fontSize: '12px' }}>★</span>)}
                </div>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.4' }}>Trusted by professionals across<br />industries and brands</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 44px', background: '#0D0F17' }}>
          <div className="fade-up-1" style={{ marginBottom: '32px' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontWeight: '500', color: '#fff', letterSpacing: '-0.02em', marginBottom: '8px' }}>{headingText}</h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.5' }}>{subText}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {error && (
              <div style={{ fontSize: 13, color: '#F87171', padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>
            )}

            {/* RESET PASSWORD FORM */}
            {mode === 'reset-password' && (
              <div className="fade-up-2" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {resetSuccess ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ padding: '16px', background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.3)', borderRadius: 10 }}>
                      <p style={{ fontSize: 13, color: 'rgba(13,148,136,0.9)', lineHeight: 1.6 }}>✓ Your password has been updated successfully.</p>
                    </div>
                    <button type="button" className="submit-btn"
                      onClick={() => { setMode('login'); setResetSuccess(false); setNewPassword(''); setConfirmNewPassword(''); }}>
                      Sign In with New Password
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <PasswordInput label="New Password" value={newPassword} onChange={setNewPassword} placeholder="At least 8 characters" show={showNewPassword} onToggle={() => setShowNewPassword(p => !p)} required autoFocus />
                    <PasswordInput label="Confirm New Password" value={confirmNewPassword} onChange={setConfirmNewPassword} placeholder="Re-enter your new password" show={showConfirmNewPassword} onToggle={() => setShowConfirmNewPassword(p => !p)} required showMatchFeedback matchValue={newPassword} />
                    <button type="submit" className="submit-btn" disabled={isLoading} style={{ marginTop: '6px' }}>
                      {isLoading ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><span className="spinner" />Updating password...</span> : 'Set New Password'}
                    </button>
                    <div style={{ textAlign: 'center', marginTop: '6px' }}>
                      <button type="button" className="mode-toggle" onClick={() => { setMode('login'); setError(null); }}>← Back to Sign In</button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* FORGOT SENT */}
            {mode === 'forgot-sent' && (
              <div className="fade-up-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.3)', borderRadius: 10 }}>
                  <p style={{ fontSize: 13, color: 'rgba(13,148,136,0.9)', lineHeight: 1.6 }}>✓ Reset link sent to <strong>{forgotEmail}</strong>. Check your inbox and spam folder.</p>
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
                  After resetting, the link will return you to VeraLooks automatically. If it takes you elsewhere, return to <strong style={{ color: 'rgba(255,255,255,0.4)' }}>app.veralooks.com</strong> and sign in normally.
                </p>
                <button type="button" className="mode-toggle" style={{ fontSize: '14px', textAlign: 'left' as const }} onClick={() => { setMode('login'); setError(null); }}>← Back to Sign In</button>
              </div>
            )}

            {/* FORGOT FORM */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="fade-up-2" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Email Address</label>
                  <input type="email" className="auth-input" placeholder="name@company.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required autoFocus />
                </div>
                <button type="submit" className="submit-btn" disabled={isLoading} style={{ marginTop: '6px' }}>
                  {isLoading ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><span className="spinner" />Sending reset link...</span> : 'Send Reset Link'}
                </button>
                <div style={{ textAlign: 'center', marginTop: '6px' }}>
                  <button type="button" className="mode-toggle" onClick={() => { setMode('login'); setError(null); }}>← Back to Sign In</button>
                </div>
              </form>
            )}

            {/* LOGIN / SIGNUP / VERIFY */}
            {(mode === 'login' || mode === 'signup' || mode === 'verify') && (
              <form onSubmit={handleSubmit} className="fade-up-2" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {mode !== 'verify' && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Email</label>
                      <input type="email" className="auth-input" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '500', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Password</label>
                      {mode === 'login' && (
                        <button type="button" className="mode-toggle" style={{ fontSize: '12px', textDecoration: 'none', color: 'rgba(255,255,255,0.35)' }}
                          onClick={() => { setForgotEmail(email); setMode('forgot'); setError(null); }}>
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <PasswordInput label="" value={password} onChange={setPassword} placeholder={mode === 'signup' ? 'Create a password' : 'Your password'} show={showPassword} onToggle={() => setShowPassword(p => !p)} required />
                    {mode === 'signup' && (
                      <PasswordInput label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Re-enter your password" show={showConfirmPassword} onToggle={() => setShowConfirmPassword(p => !p)} required showMatchFeedback matchValue={password} />
                    )}
                  </>
                )}
                {mode === 'verify' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Verification Code</label>
                    <input type="text" className="auth-input" placeholder="Enter code from your email" value={otpCode} onChange={e => setOtpCode(e.target.value)} autoFocus />
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>Check your email for the verification code.</p>
                    <button type="button" className="mode-toggle" style={{ fontSize: '13px', marginTop: '10px' }}
                      onClick={async () => {
                        setError(null);
                        try {
                          await onLogin?.('email', { email: pendingEmail, password: pendingPassword }, true);
                        } catch {}
                      }}>
                      Resend verification email
                    </button>
                  </div>
                )}
                <button type="submit" className="submit-btn" disabled={isLoading} style={{ marginTop: '6px' }}>
                  {isLoading
                    ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><span className="spinner" />{mode === 'signup' ? 'Creating account...' : 'Signing in...'}</span>
                    : mode === 'verify' ? 'Verify & Continue' : mode === 'signup' ? 'Create Account & Get Started' : 'Sign In'}
                </button>
              </form>
            )}

            {(mode === 'login' || mode === 'signup') && (
              <div className="fade-up-3" style={{ marginTop: '10px' }}>
                <button type="button"
                  onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(null); setConfirmPassword(''); setShowPassword(false); setShowConfirmPassword(false); }}
                  style={{ width: '100%', padding: '12px 20px', background: 'rgba(159,103,255,0.08)', border: '1px solid rgba(159,103,255,0.25)', borderRadius: '10px', color: '#B98FFF', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease', letterSpacing: '-0.01em' }}
                  onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(159,103,255,0.14)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(159,103,255,0.45)'; }}
                  onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(159,103,255,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(159,103,255,0.25)'; }}
                >
                  {mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            )}
            {(mode === 'login' || mode === 'signup') && (
              <div className="fade-up-4" style={{ textAlign: 'center', marginTop: '4px' }}>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', lineHeight: '1.5' }}>
                  By continuing, you agree to our{' '}
                  <a href="#" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Terms</a>
                  {' '}and{' '}
                  <a href="#" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Privacy Policy</a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
