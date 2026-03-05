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

  const login = async (provider: 'google' | 'email', credentials?: { email: string; password: string }) => {
    if (provider === 'google') {
      auth.redirectToLogin(window.location.href);
    } else if (credentials) {
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