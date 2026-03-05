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
        // Check for token in URL (returned after Base44 OAuth redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('access_token');
        if (urlToken) {
          auth.setToken(urlToken);
          // Clean token from URL
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

    const login = async (provider: 'google' | 'email', credentials?: { email: string; password: string }, isSignup?: boolean) => {
       if (provider === 'google') {
          auth.redirectToLogin('https://app.veralooks.com');
       } else if (credentials) {
          if (isSignup) {
          await auth.register({ email: credentials.email, password: credentials.password });
        }
        const response = await auth.loginViaEmailPassword(credentials.email, credentials.password);
        auth.setToken(response.access_token);
        const currentUser = await auth.me();
        setUser(currentUser);
      }
    };

  const logout = async () => {
    await auth.logout();
    setUser(null);
  };

  return { user, isLoading, login, logout };
};