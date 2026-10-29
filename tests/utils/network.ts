import type { Page } from '@playwright/test';
import { env } from '../config/env';

export const isApi = (path: string) => (url: URL) => `${url.origin}${url.pathname}` === `${env.apiUrl}${path}`;

// Needed because the page (localhost:3000) and API are different origins.
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };

/** Force one API endpoint to answer with a given status/message (only for the given HTTP method). */
export async function mockApi(page: Page, method: string, path: string, status: number, message: string): Promise<void> {
  await page.route(isApi(path), async (route) => {
    if (route.request().method() !== method) return route.fallback();
    return route.fulfill({ status, headers: CORS, contentType: 'application/json', body: JSON.stringify({ message }) });
  });
}

/** Hold matching requests until release() is called: lets tests observe pending UI without sleeping. */
export async function holdApi(page: Page, method: string, path: string): Promise<{ release: () => void; count: () => number }> {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let seen = 0;
  await page.route(isApi(path), async (route) => {
    if (route.request().method() !== method) return route.fallback();
    seen += 1;
    await gate;
    return route.continue();
  });
  return { release, count: () => seen };
}
