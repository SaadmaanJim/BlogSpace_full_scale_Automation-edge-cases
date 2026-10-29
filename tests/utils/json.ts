export type Json = Record<string, unknown>;
export const asRecord = (v: unknown): Json => (typeof v === 'object' && v !== null ? (v as Json) : {});

/** The list endpoints may return a bare array or wrap it; accept both. */
export function listOf(body: unknown): Json[] {
  if (Array.isArray(body)) return body as Json[];
  const record = asRecord(body);
  for (const key of ['blogs', 'users', 'data', 'items', 'results']) {
    if (Array.isArray(record[key])) return record[key] as Json[];
  }
  return [];
}
export const idOf = (item: Json): string => String(item.id ?? item._id ?? '');
export const titleOf = (item: Json): string => String(item.blogTitle ?? item.title ?? '');
export const categoryOf = (item: Json): string => String(item.category ?? '');
