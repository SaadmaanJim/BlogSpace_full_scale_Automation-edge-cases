export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api').replace(/\/+$/, '');
export const API_ORIGIN = new URL(API_URL).origin;

export const APP_NAME = 'BlogSpace';
export const TOKEN_STORAGE_KEY = 'blogspace.token';
// Non-secret presence flag so middleware.ts (which cannot read localStorage) can redirect early.
export const AUTH_COOKIE_NAME = 'bs_auth';
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24;

export const MIN_PASSWORD_LENGTH = 6;
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const ALLOWED_AVATAR_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];

// The API has no categories endpoint, so the filter list is a constant (documented in README).
export const CATEGORIES = ['Testing', 'Automation', 'Programming', 'DevOps', 'AI'] as const;
export const EXCERPT_LENGTH = 140;
export const RECENT_BLOGS_COUNT = 5;
export const TOAST_DURATION_MS = 4000;
