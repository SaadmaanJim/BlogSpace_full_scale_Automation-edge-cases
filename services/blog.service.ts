import { apiFetch } from '@/lib/api/client';
import { extractList, normalizeBlog } from '@/lib/api/normalize';
import type { Blog, BlogPayload } from '@/types';

const enc = encodeURIComponent;

export const blogService = {
  list: async (filters: { title?: string; category?: string } = {}, signal?: AbortSignal): Promise<Blog[]> =>
    extractList(await apiFetch('/blogs', { query: filters, signal })).map(normalizeBlog),
  getById: async (id: string, signal?: AbortSignal): Promise<Blog> => normalizeBlog(await apiFetch(`/blogs/${enc(id)}`, { signal })),
  // Payload type has no userId on purpose: the backend derives the author from the token.
  create: (payload: BlogPayload) => apiFetch('/blogs/create', { method: 'POST', body: payload }),
  update: (id: string, payload: BlogPayload) => apiFetch(`/blogs/update/${enc(id)}`, { method: 'PUT', body: payload }),
  remove: (id: string) => apiFetch(`/blogs/delete/${enc(id)}`, { method: 'DELETE' }),
};
