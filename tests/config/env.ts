import path from 'node:path';
import dotenv from 'dotenv';

// Runs before the values below are read (first statement of this module).
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

export const env = {
  baseUrl: process.env.BASE_URL ?? 'http://localhost:3000',
  apiUrl: (process.env.API_URL ?? 'http://localhost:5000/api').replace(/\/+$/, ''),
  admin: { email: process.env.ADMIN_EMAIL ?? 'admin@example.com', password: process.env.ADMIN_PASSWORD ?? 'password123' },
  resetLogPath: process.env.RESET_LOG_PATH ? path.resolve(process.env.RESET_LOG_PATH) : undefined,
} as const;

// Must match the frontend (lib/config.ts).
export const TOKEN_STORAGE_KEY = 'blogspace.token';
export const AUTH_COOKIE_NAME = 'bs_auth';
export const CATEGORIES = ['Testing', 'Automation', 'Programming', 'DevOps', 'AI'] as const;
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
