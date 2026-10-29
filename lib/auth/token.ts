import { AUTH_COOKIE_MAX_AGE_SECONDS, AUTH_COOKIE_NAME, TOKEN_STORAGE_KEY } from '@/lib/config';

const inBrowser = () => typeof window !== 'undefined';

export function getToken(): string | null {
  if (!inBrowser()) return null;
  try { return window.localStorage.getItem(TOKEN_STORAGE_KEY); } catch { return null; }
}
export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  document.cookie = `${AUTH_COOKIE_NAME}=1; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}
export function clearToken(): void {
  if (!inBrowser()) return;
  try { window.localStorage.removeItem(TOKEN_STORAGE_KEY); } catch { /* storage unavailable */ }
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
