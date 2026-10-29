import { request } from '@playwright/test';
import { env } from './config/env';

/** Fail fast with an actionable message instead of 200 confusing red tests. */
export default async function globalSetup(): Promise<void> {
  const ctx = await request.newContext();
  try {
    const health = await ctx.get(`${env.apiUrl}/blogs`).catch(() => null);
    if (!health) throw new Error(`Blog API is not reachable at ${env.apiUrl}. Start the backend or set API_URL in .env.test.`);

    const login = await ctx.post(`${env.apiUrl}/auth/login`, { data: env.admin });
    if (!login.ok()) {
      throw new Error(
        `Admin login failed (${login.status()}). Register ${env.admin.email} once, then run: ` +
          `UPDATE users SET role = 'admin' WHERE email = '${env.admin.email}';`,
      );
    }
    const body = (await login.json()) as { user?: { role?: string } };
    if (body.user?.role && body.user.role !== 'admin') {
      throw new Error(`${env.admin.email} exists but its role is '${body.user.role}', not 'admin'.`);
    }
  } finally {
    await ctx.dispose();
  }
}
