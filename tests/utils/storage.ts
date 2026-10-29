import type { BrowserContextOptions } from '@playwright/test';
import { AUTH_COOKIE_NAME, env, TOKEN_STORAGE_KEY } from '../config/env';

type StorageState = Exclude<BrowserContextOptions['storageState'], string | undefined>;

/** In-memory storageState: the app is "logged in" without touching the login UI (fast + isolated). */
export function buildStorageState(token: string): StorageState {
  const origin = new URL(env.baseUrl);
  return {
    cookies: [{ name: AUTH_COOKIE_NAME, value: '1', domain: origin.hostname, path: '/', expires: -1, httpOnly: false, secure: false, sameSite: 'Lax' }],
    origins: [{ origin: origin.origin, localStorage: [{ name: TOKEN_STORAGE_KEY, value: token }] }],
  };
}
