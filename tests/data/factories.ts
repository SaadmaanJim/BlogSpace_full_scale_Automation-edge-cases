import { randomUUID } from 'node:crypto';

export interface NewUser { firstname: string; lastname: string; email: string; password: string }
export interface BlogInput { blogTitle: string; blog: string; category: string }
export interface UploadFile { name: string; mimeType: string; buffer: Buffer }

export const uniqueSuffix = (): string => randomUUID().replace(/-/g, '').slice(0, 10);

/** Unique per call, so tests never collide when running in parallel or being re-run. */
export function buildUser(overrides: Partial<NewUser> = {}): NewUser {
  const s = uniqueSuffix();
  return { firstname: 'E2E', lastname: `User${s}`, email: `e2e.${s}@example.com`, password: 'password123', ...overrides };
}

export function buildBlog(overrides: Partial<BlogInput> = {}): BlogInput {
  const s = uniqueSuffix();
  return {
    blogTitle: `E2E Blog ${s}`,
    blog: `Automated test content ${s}. ${'Lorem ipsum dolor sit amet. '.repeat(3)}`,
    category: 'Testing',
    ...overrides,
  };
}

// 1x1 transparent PNG
export const TINY_PNG: UploadFile = {
  name: 'avatar.png',
  mimeType: 'image/png',
  buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'),
};
export const TEXT_FILE: UploadFile = { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') };
