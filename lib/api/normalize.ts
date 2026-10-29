/**
 * ADAPTER: the ONLY place that knows the backend's JSON field names.
 * The response shapes below were inferred from the Postman collection (not from live responses),
 * so each field accepts several plausible names. If something shows up empty in the UI, fix it here.
 */
import { API_ORIGIN } from '@/lib/config';
import type { Blog, User } from '@/types';

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const toStr = (v: unknown): string | undefined => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : undefined);
const toBool = (v: unknown): boolean | undefined => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.toLowerCase();
    if (['true', '1', 'active'].includes(s)) return true;
    if (['false', '0', 'inactive'].includes(s)) return false;
  }
  return undefined;
};

export function resolveMediaUrl(path: string | undefined | null): string | null {
  if (!path) return null;
  if (/^(https?:|data:)/i.test(path)) return path;
  return `${API_ORIGIN}/${path.replace(/^\/+/, '')}`;
}

export function extractList(input: unknown): unknown[] {
  if (Array.isArray(input)) return input;
  if (isObj(input)) {
    for (const key of ['blogs', 'users', 'data', 'items', 'results']) {
      const candidate = input[key];
      if (Array.isArray(candidate)) return candidate;
    }
  }
  return [];
}

export function normalizeUser(input: unknown): User {
  let raw: Raw = isObj(input) ? input : {};
  if (isObj(raw.user)) raw = raw.user;
  else if (isObj(raw.data)) raw = raw.data;
  return {
    id: toStr(raw.id ?? raw._id ?? raw.userId) ?? '',
    firstname: toStr(raw.firstname ?? raw.firstName) ?? '',
    lastname: toStr(raw.lastname ?? raw.lastName) ?? '',
    email: toStr(raw.email) ?? '',
    role: toStr(raw.role) === 'admin' ? 'admin' : 'user',
    isActive: toBool(raw.isActive) ?? toBool(raw.is_active) ?? toBool(raw.status) ?? true,
    profileImage: resolveMediaUrl(toStr(raw.profileImage ?? raw.profile_image ?? raw.image ?? raw.avatar)),
    createdAt: toStr(raw.createdAt ?? raw.created_at) ?? null,
  };
}

export function normalizeBlog(input: unknown): Blog {
  let raw: Raw = isObj(input) ? input : {};
  // Create/get responses wrap the record in `blog`; the content field is ALSO called `blog`, so check type.
  if (isObj(raw.blog)) raw = raw.blog;
  else if (isObj(raw.data)) raw = raw.data;

  const authorRaw = isObj(raw.author) ? raw.author : isObj(raw.user) ? raw.user : undefined;
  const first = toStr(authorRaw?.firstname ?? authorRaw?.firstName ?? raw.firstname) ?? '';
  const last = toStr(authorRaw?.lastname ?? authorRaw?.lastName ?? raw.lastname) ?? '';
  const name =
    [first, last].filter(Boolean).join(' ') ||
    toStr(raw.authorName ?? raw.author_name ?? (typeof raw.author === 'string' ? raw.author : undefined)) ||
    'Unknown author';

  return {
    id: toStr(raw.id ?? raw._id) ?? '',
    title: toStr(raw.blogTitle ?? raw.title) ?? '',
    content: toStr(raw.blog ?? raw.content ?? raw.body) ?? '',
    category: toStr(raw.category) ?? '',
    createdAt: toStr(raw.createdAt ?? raw.created_at) ?? null,
    author: {
      id: toStr(authorRaw?.id ?? authorRaw?._id ?? raw.userId ?? raw.user_id ?? raw.authorId ?? raw.author_id) ?? null,
      name,
      image: resolveMediaUrl(toStr(authorRaw?.profileImage ?? authorRaw?.profile_image ?? raw.profileImage ?? raw.authorImage)),
    },
  };
}
