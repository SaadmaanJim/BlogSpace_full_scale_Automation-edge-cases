import { API_URL } from '@/lib/config';
import { getToken } from '@/lib/auth/token';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
interface RequestOptions {
  method?: Method;
  body?: unknown;
  formData?: FormData;
  query?: Record<string, string | undefined>;
  signal?: AbortSignal;
}

const DEFAULT_MESSAGES: Record<number, string> = {
  400: 'Invalid request.',
  401: 'Please log in to continue.',
  403: 'You are not authorized to perform this action.',
  404: 'Not found.',
  409: 'This record already exists.',
};

let unauthorizedHandler: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: (() => void) | null) => { unauthorizedHandler = handler; };

function extractMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>;
    if (typeof p.message === 'string') return p.message;
    if (typeof p.error === 'string') return p.error;
    if (Array.isArray(p.errors) && p.errors.length > 0) {
      const first = p.errors[0];
      if (typeof first === 'string') return first;
      if (first && typeof first === 'object' && typeof (first as Record<string, unknown>).message === 'string') {
        return (first as Record<string, string>).message;
      }
    }
  }
  return fallback;
}

function buildQuery(query?: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([k, v]) => { if (v) params.set(k, v); });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/** Single entry point for every backend call: auth header, JSON parsing, central error handling. */
export async function apiFetch<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, formData, query, signal } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (formData) payload = formData; // browser sets the multipart boundary itself
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}${buildQuery(query)}`, { method, headers, body: payload, signal, cache: 'no-store' });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(0, 'Cannot reach the server. Check your connection and that the API is running.');
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) { try { data = JSON.parse(text); } catch { data = null; } }

  if (!response.ok) {
    // Expired/invalid session on a protected call: drop the session (login failures use /auth/* and are excluded).
    if (response.status === 401 && token && !path.startsWith('/auth/')) unauthorizedHandler?.();
    throw new ApiError(response.status, extractMessage(data, DEFAULT_MESSAGES[response.status] ?? 'Something went wrong.'), data);
  }
  return data as T;
}
