import { EXCERPT_LENGTH } from '@/lib/config';
import { fullName } from '@/lib/format';
import type { Blog, User } from '@/types';

// UI-only helpers. The backend is the real authority on who may edit/delete (403).
export function isOwner(blog: Blog, user: User): boolean {
  if (blog.author.id !== null) return blog.author.id === user.id;
  return blog.author.name === fullName(user); // fallback if the API exposes no author id
}
export const canManage = (blog: Blog, user: User) => user.role === 'admin' || isOwner(blog, user);

const time = (iso: string | null) => (iso ? new Date(iso).getTime() || 0 : 0);
export const sortNewestFirst = (blogs: Blog[]) => [...blogs].sort((a, b) => time(b.createdAt) - time(a.createdAt));

export function excerpt(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= EXCERPT_LENGTH ? clean : `${clean.slice(0, EXCERPT_LENGTH).trimEnd()}…`;
}
