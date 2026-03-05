import React, { useState } from 'react';

type LoginFn = (provider: 'google' | 'email' | 'verify', credentials?: { email: string; password: string }, isSignup?: boolean) => Promise<void>;

export { AuthScreen };
export default function AuthScreen({ onLogin }: { onLogin?: LoginFn }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'verify'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onLogin?.('google');
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'verify') {
        await onLogin?.('verify' as any, { email: pendingEmail, password: otpCode });
      } else {
        await onLogin?.('email', { email, password }, mode === 'signup');
      }
    } catch (err: any) {
      if (err.message === 'VERIFY_EMAIL') {
        setPendingEmail(email);
        setMode('verify');
        return;
      }
      setError(err.message || 'Sign-in failed. Please check your credentials.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080A0F',
      display: 'flex',
      fontFamily: "'DM Sans', sans-serif",
      overflow: 'hidden',
      position: 'relative',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 14px 16px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          outline: none;
          transition: all 0.2s ease;
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.25); }
        .auth-input:focus {
          border-color: rgba(139, 92, 246, 0.6);
          background: rgba(139, 92, 246, 0.06);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 13px 20px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          color: rgba(255,255,255,0.85);
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: -0.01em;
        }
        .google-btn:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-1px);
        }

        .submit-btn {
          width: 100%;
          padding: 14px 20px;
          background: linear-gradient(135deg, #7C3AED, #9F67FF);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s ease;
          letter-spacing: -0.01em;
          position: relative;
          overflow: hidden;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(124, 58, 237, 0.4);
        }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .mode-toggle {
          background: none;
          border: none;
          color: #9F67FF;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 2px;
          padding: 0;
        }
        .mode-toggle:hover { color: #B98FFF; }

        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.08);
        }

        .noise-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 200px;
          z-index: 1;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
        .fade-up-1 { animation: fadeUp 0.6s 0.1s ease both; }
        .fade-up-2 { animation: fadeUp 0.6s 0.2s ease both; }
        .fade-up-3 { animation: fadeUp 0.6s 0.3s ease both; }
        .fade-up-4 { animation: fadeUp 0.6s 0.4s ease both; }
        .fade-up-5 { animation: fadeUp 0.6s 0.5s ease both; }

        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }

        .sample-photo {
          width: 52px; height: 52px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.15);
          object-fit: cover;
          background: rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          overflow: hidden;
        }
      `}</style>

      {/* Noise texture */}
      <div className="noise-overlay" />

      {/* Ambient glow */}
      <div style={{
        position: 'fixed',
        top: '-20%', left: '-10%',
        width: '60%', height: '60%',
        background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{
        position: 'fixed',
        bottom: '-20%', right: '-10%',
        width: '50%', height: '50%',
        background: 'radial-gradient(ellipse, rgba(79,70,229,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Left panel — brand story */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 56px',
        position: 'relative',
        zIndex: 2,
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Logo */}
        <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #7C3AED, #9F67FF)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: '700', color: '#fff',
            fontFamily: "'Cormorant Garamond', serif",
            letterSpacing: '-0.02em',
          }}>V</div>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '22px',
            fontWeight: '500',
            color: '#fff',
            letterSpacing: '0.02em',
          }}>VeraLooks</span>
        </div>

        {/* Main headline */}
        <div style={{ maxWidth: '420px' }}>
          <div className="fade-up-1" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: '100px',
            padding: '5px 12px',
            marginBottom: '28px',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#9F67FF' }} />
            <span style={{ fontSize: '12px', color: '#B98FFF', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              AI Brand Photography
            </span>
          </div>

          <h1 className="fade-up-2" style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '52px',
            lineHeight: '1.1',
            fontWeight: '400',
            color: '#fff',
            letterSpacing: '-0.02em',
            marginBottom: '20px',
          }}>
            Your brand,<br />
            <em style={{ color: 'rgba(159,103,255,0.9)' }}>beautifully</em><br />
            photographed.
          </h1>

          <p className="fade-up-3" style={{
            fontSize: '16px',
            lineHeight: '1.65',
            color: 'rgba(255,255,255,0.45)',
            fontWeight: '300',
            maxWidth: '360px',
          }}>
            Professional brand photos generated from your photos. Built by a working photographer, not a software company.
          </p>
        </div>

        {/* Social proof */}
        <div className="fade-up-4">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '20px 24px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px',
            maxWidth: '380px',
          }}>
            <div style={{ display: 'flex' }}>
              {['👩‍💼', '👨‍💻', '👩‍🎨', '👨‍⚕️'].map((emoji, i) => (
                <div key={i} className="sample-photo" style={{ marginLeft: i > 0 ? '-10px' : '0', zIndex: 4 - i }}>
                  {emoji}
                </div>
              ))}
            </div>
            <div>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                {[1,2,3,4,5].map(i => (
                  <span key={i} style={{ color: '#F59E0B', fontSize: '13px' }}>★</span>
                ))}
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.4' }}>
                Trusted by professionals across<br />industries and brands
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div style={{
        width: '440px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 52px',
        position: 'relative',
        zIndex: 2,
      }}>
        <div className="fade-up-1" style={{ marginBottom: '36px' }}>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '30px',
            fontWeight: '500',
            color: '#fff',
            letterSpacing: '-0.02em',
            marginBottom: '8px',
          }}>
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.5' }}>
            {mode === 'signup'
              ? 'Your credits are ready — sign up to start generating.'
              : 'Sign in to access your credits and brand photos.'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Google SSO */}
          <div className="fade-up-2">
            <button className="google-btn" type="button" onClick={handleGoogleLogin} disabled={isLoading}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div style={{ fontSize: 13, color: '#F87171', padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          {/* Divider */}
          <div className="fade-up-3" style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
            <div className="divider-line" />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
              or continue with email
            </span>
            <div className="divider-line" />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleSubmit} className="fade-up-4" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Email
              </label>
              <input
                type="email"
                className="auth-input"
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Password
                </label>
                {mode === 'login' && (
                  <button type="button" className="mode-toggle" style={{ fontSize: '12px', textDecoration: 'none', color: 'rgba(255,255,255,0.35)' }}>
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                className="auth-input"
                placeholder={mode === 'signup' ? 'Create a password' : 'Your password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading}
              style={{ marginTop: '6px' }}
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <span className="spinner" />
                  {mode === 'signup' ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : (
                mode === 'signup' ? 'Create Account & Get Started' : 'Sign In'
              )}
            </button>
          </form>

          {/* Mode toggle */}
          <div className="fade-up-5" style={{ textAlign: 'center', marginTop: '8px' }}>
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>
              {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
            </span>
            <button className="mode-toggle" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
              {mode === 'signup' ? 'Sign in' : 'Sign up'}
            </button>
          </div>

          {/* Legal */}
          <div className="fade-up-5" style={{ textAlign: 'center', marginTop: '4px' }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', lineHeight: '1.5' }}>
              By continuing, you agree to our{' '}
              <a href="#" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Terms</a>
              {' '}and{' '}
              <a href="#" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
