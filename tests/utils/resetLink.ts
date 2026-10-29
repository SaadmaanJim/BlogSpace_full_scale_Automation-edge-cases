import { existsSync, readFileSync } from 'node:fs';
import { env } from '../config/env';

// Windows PowerShell's Tee-Object writes UTF-16LE; Node's default utf8 would return garbage.
function readLog(file: string): string {
  const raw = readFileSync(file);
  return raw[0] === 0xff && raw[1] === 0xfe ? raw.toString('utf16le') : raw.toString('utf8');
}

/** Newest reset link the backend printed for this email, or null. */
export function findResetLink(email: string): string | null {
  if (!env.resetLogPath || !existsSync(env.resetLogPath)) return null;
  const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`Password reset link for ${escaped}: (http\\S+)`, 'g');
  let latest: string | null = null;
  for (const match of readLog(env.resetLogPath).matchAll(pattern)) latest = match[1] ?? latest;
  return latest;
}
