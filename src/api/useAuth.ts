import { useState, useEffect } from 'react';
import { auth } from './base44Client';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  creditsBalance?: number;
  planType?: string;
  planName?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('access_token');
        if (urlToken) {
          auth.setToken(urlToken);
          window.history.replaceState({}, '', window.location.pathname);
        }
        const storedToken = localStorage.getItem('base44_access_token');
        if (storedToken) {
          auth.setToken(storedToken);
        }
        const currentUser = await auth.me();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (provider: 'google' | 'email' | 'verify', credentials?: { email: string; password: string; otpCode?: string }, isSignup?: boolean) => {
    if (provider === 'google') {
      window.location.href = `https://base44.app/login?app_id=69a8dfde570848365d594a26&from_url=${encodeURIComponent(window.location.origin)}`;
    } else if (provider === 'verify' && credentials) {
      await auth.verifyOtp({ email: credentials.email, otpCode: credentials.otpCode || '' });
      const response = await auth.loginViaEmailPassword(credentials.email, credentials.password);
      auth.setToken(response.access_token);
      const currentUser = await auth.me();
      setUser(currentUser);
    } else if (credentials) {
      try {
        if (isSignup) {
          await auth.register({ email: credentials.email, password: credentials.password });
          throw new Error('VERIFY_EMAIL');
        }
        const response = await auth.loginViaEmailPassword(credentials.email, credentials.password);
        auth.setToken(response.access_token);
        const currentUser = await auth.me();
        setUser(currentUser);
      } catch (err: any) {
        console.error('Auth error:', err);
        if (err.message === 'VERIFY_EMAIL') throw err;
        throw new Error(err?.response?.data?.message || err?.message || 'Invalid email or password');
      }
    }
  };

  const logout = async () => {
    await auth.logout();
    setUser(null);
  };

  return { user, isLoading, login, logout };
};