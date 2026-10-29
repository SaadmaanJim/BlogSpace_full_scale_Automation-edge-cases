import { apiFetch, ApiError } from '@/lib/api/client';

export interface RegisterPayload { firstname: string; lastname: string; email: string; password: string }

export const authService = {
  register: (payload: RegisterPayload) => apiFetch('/auth/register', { method: 'POST', body: payload }),

  async login(email: string, password: string): Promise<{ token: string }> {
    const data = await apiFetch<{ token?: unknown }>('/auth/login', { method: 'POST', body: { email, password } });
    if (typeof data?.token !== 'string') throw new ApiError(500, 'Login response did not include a token.');
    return { token: data.token };
  },

  async forgotPassword(email: string): Promise<string> {
    const data = await apiFetch<{ message?: string }>('/auth/forgot-password', { method: 'POST', body: { email } });
    return data?.message ?? 'If this email is registered, a reset link has been sent.';
  },

  resetPassword: (token: string, password: string) =>
    apiFetch(`/auth/reset-password/${encodeURIComponent(token)}`, { method: 'PATCH', body: { password } }),
};
