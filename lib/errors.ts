import { ApiError } from '@/lib/api/client';

export const getErrorMessage = (error: unknown): string =>
  error instanceof ApiError ? error.message : error instanceof Error ? error.message : 'Something went wrong.';
export const getErrorStatus = (error: unknown): number | null => (error instanceof ApiError ? error.status : null);
