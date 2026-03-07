import React, { useState } from 'react';

type LoginFn = (provider: 'google' | 'email' | 'verify', credentials?: { email: string; password: string; otpCode?: string }, isSignup?: boolean) => Promise<void>;

export { AuthScreen };
export default function AuthScreen({ onLogin }: { onLogin?: LoginFn }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'verify'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'verify') {
        await onLogin?.('verify' as any, { email: pendingEmail, password: pendingPassword, otpCode } as any);
      } else {
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

      <div className="noise-overlay" />

      <div style={{
        position: 'fixed', top: '-20%', left: '-10%',
        width: '60%', height: '60%',
        background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', right: '-10%',
        width: '50%', height: '50%',
        background: 'radial-gradient(ellipse, rgba(79,70,229,0.08) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Left panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '48px 56px',
        position: 'relative', zIndex: 2,
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #7C3AED, #9F67FF)',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: '700', color: '#fff',
            fontFamily: "'Cormorant Garamond', serif", letterSpacing: '-0.02em',
          }}>V</div>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: '22px',
            fontWeight: '500', color: '#fff', letterSpacing: '0.02em',
          }}>VeraLooks</span>
        </div>

        <div style={{ maxWidth: '420px' }}>
          <div className="fade-up-1" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: '100px', padding: '5px 12px', marginBottom: '28px',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#9F67FF' }} />
            <span style={{ fontSize: '12px', color: '#B98FFF', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              AI Brand Photography
            </span>
          </div>

          <h1 className="fade-up-2" style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: '52px',
            lineHeight: '1.1', fontWeight: '400', color: '#fff',
            letterSpacing: '-0.02em', marginBottom: '20px',
          }}>
            Your brand,<br />
            <em style={{ color: 'rgba(159,103,255,0.9)' }}>beautifully</em><br />
            photographed.
          </h1>

          <p className="fade-up-3" style={{
            fontSize: '16px', lineHeight: '1.65',
            color: 'rgba(255,255,255,0.45)', fontWeight: '300', maxWidth: '360px',
          }}>
            Professional brand photos generated from your photos. Built by a working photographer, not a software company.
          </p>
        </div>

        <div className="fade-up-4">
          <div style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            padding: '20px 24px', background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', maxWidth: '380px',
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
                {[1,2,3,4,5].map(i => <span key={i} style={{ color: '#F59E0B', fontSize: '13px' }}>★</span>)}
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
        width: '440px', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '48px 52px',
        position: 'relative', zIndex: 2,
      }}>
        <div className="fade-up-1" style={{ marginBottom: '36px' }}>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: '30px',
            fontWeight: '500', color: '#fff', letterSpacing: '-0.02em', marginBottom: '8px',
          }}>
            {mode === 'verify' ? 'Check your email' : mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.5' }}>
            {mode === 'verify'
              ? 'Enter the verification code we sent you.'
              : mode === 'signup'
              ? 'Your credits are ready — sign up to start generating.'
              : 'Sign in to access your credits and brand photos.'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {error && (
            <div style={{ fontSize: 13, color: '#F87171', padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="fade-up-2" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {mode !== 'verify' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Email
                  </label>
                  <input
                    type="email" className="auth-input" placeholder="name@company.com"
                    value={email} onChange={e => setEmail(e.target.value)} required autoFocus
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
                    type="password" className="auth-input"
                    placeholder={mode === 'signup' ? 'Create a password' : 'Your password'}
                    value={password} onChange={e => setPassword(e.target.value)} required
                  />
                </div>
              </>
            )}

            {mode === 'verify' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
                  Verification Code
                </label>
                <input
                  type="text" className="auth-input"
                  placeholder="Enter code from your email"
                  value={otpCode} onChange={e => setOtpCode(e.target.value)} autoFocus
                />
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
                  Check your email for the verification code.
                </p>
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={isLoading} style={{ marginTop: '6px' }}>
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <span className="spinner" />
                  {mode === 'signup' ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : (
                mode === 'verify' ? 'Verify & Continue' :
                mode === 'signup' ? 'Create Account & Get Started' : 'Sign In'
              )}
            </button>
          </form>

          {mode !== 'verify' && (
            <div className="fade-up-3" style={{ textAlign: 'center', marginTop: '8px' }}>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>
                {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
              </span>
              <button className="mode-toggle" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
                {mode === 'signup' ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          )}

          <div className="fade-up-4" style={{ textAlign: 'center', marginTop: '4px' }}>
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
