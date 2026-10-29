import { apiFetch } from '@/lib/api/client';
import { extractList, normalizeUser } from '@/lib/api/normalize';
import type { User } from '@/types';

export const userService = {
  getProfile: async (): Promise<User> => normalizeUser(await apiFetch('/users/profile')),
  // Only names are sent: role / isActive are never exposed to the client for self-editing.
  updateProfile: (payload: { firstname: string; lastname: string }) => apiFetch('/users/profile/update', { method: 'PUT', body: payload }),
  uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    return apiFetch('/users/profile/image', { method: 'PATCH', formData });
  },
  changePassword: (password: string) => apiFetch('/users/password', { method: 'PATCH', body: { password } }),

  // Admin only (enforced by the backend)
  list: async (signal?: AbortSignal): Promise<User[]> => extractList(await apiFetch('/users', { signal })).map(normalizeUser),
  getById: async (id: string, signal?: AbortSignal): Promise<User> => normalizeUser(await apiFetch(`/users/${encodeURIComponent(id)}`, { signal })),
  setStatus: (id: string, isActive: boolean) => apiFetch(`/users/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { isActive } }),
};
