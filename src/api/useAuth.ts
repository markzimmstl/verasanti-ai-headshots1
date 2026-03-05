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

  const login = async (provider: 'google' | 'email' | 'verify', credentials?: { email: string; password: string }, isSignup?: boolean) => {
    if (provider === 'google') {
      auth.redirectToLogin('https://app.veralooks.com');
    } else if (provider === 'verify' && credentials) {
      await auth.verifyOtp({ email: credentials.email, otpCode: credentials.password });
      const response = await auth.loginViaEmailPassword(credentials.email, credentials.password);
      auth.setToken(response.access_token);
      const currentUser = await auth.me();
      setUser(currentUser);
    } else if (credentials) {
      try {
        if (isSignup) {
          await auth.register({ email: credentials.email, password: credentials.password });
          return;
        }
        const response = await auth.loginViaEmailPassword(credentials.email, credentials.password);
        auth.setToken(response.access_token);
        const currentUser = await auth.me();
        setUser(currentUser);
      } catch (err: any) {
        console.error('Auth error:', err);
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