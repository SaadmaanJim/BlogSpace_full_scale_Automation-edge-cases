'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, setUnauthorizedHandler } from '@/lib/api/client';
import { clearToken, getToken, setToken } from '@/lib/auth/token';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import type { User } from '@/types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
type EndReason = 'logout' | 'expired' | null;

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  isAdmin: boolean;
  /** Why the last session ended; lets AuthGuard choose the right login redirect. */
  endReason: EndReason;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: (options?: { bustAvatarCache?: boolean }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const bust = (url: string | null) => (url ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}` : null);

/** Single source of truth for "who is logged in". Token lives in localStorage (see README for the trade-off). */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [endReason, setEndReason] = useState<EndReason>(null);

  const endSession = useCallback(() => { clearToken(); setUser(null); setStatus('unauthenticated'); }, []);

  const loadProfile = useCallback(async (bustAvatarCache = false) => {
    const profile = await userService.getProfile();
    setUser(bustAvatarCache ? { ...profile, profileImage: bust(profile.profileImage) } : profile);
    setStatus('authenticated');
  }, []);

  // Restore the session after a page refresh by re-validating the stored token against the API.
  useEffect(() => {
    if (!getToken()) { setStatus('unauthenticated'); return; }
    loadProfile().catch((error: unknown) => {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) clearToken();
      setUser(null);
      setStatus('unauthenticated');
    });
  }, [loadProfile]);

  // Central reaction to an expired token on any protected request.
  useEffect(() => {
    setUnauthorizedHandler(() => { setEndReason('expired'); endSession(); }); // AuthGuard performs the redirect
    return () => setUnauthorizedHandler(null);
  }, [endSession]);

  const login = useCallback(async (email: string, password: string) => {
    const { token } = await authService.login(email, password);
    setToken(token);
    setEndReason(null);
    try { await loadProfile(); } catch (error) { endSession(); throw error; }
  }, [loadProfile, endSession]);

  const logout = useCallback(() => { setEndReason('logout'); endSession(); router.replace('/login'); }, [endSession, router]);

  const refreshUser = useCallback(
    (options?: { bustAvatarCache?: boolean }) => loadProfile(options?.bustAvatarCache ?? false),
    [loadProfile],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, isAdmin: user?.role === 'admin', endReason, login, logout, refreshUser }),
    [user, status, endReason, login, logout, refreshUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
