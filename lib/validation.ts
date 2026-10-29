import { z } from 'zod';
import { ALLOWED_AVATAR_TYPES, CATEGORIES, MAX_AVATAR_BYTES, MIN_PASSWORD_LENGTH } from '@/lib/config';

const name = (label: string) => z.string().trim().min(1, `${label} is required`).max(50, `${label} is too long`);
const email = z.string().trim().min(1, 'Email is required').email('Enter a valid email address');
const password = z.string().min(1, 'Password is required').min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);

const withConfirmation = <T extends z.ZodRawShape>(shape: T) =>
  z.object({ ...shape, confirmPassword: z.string().min(1, 'Please confirm your password') })
    .refine((v) => (v as { password: string }).password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export const loginSchema = z.object({ email, password: z.string().min(1, 'Password is required') });
export const registerSchema = withConfirmation({ firstname: name('First name'), lastname: name('Last name'), email, password });
export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = withConfirmation({ password });
export const changePasswordSchema = withConfirmation({ password });
export const profileSchema = z.object({ firstname: name('First name'), lastname: name('Last name') });
export const blogSchema = z.object({
  blogTitle: z.string().trim().min(3, 'Title must be at least 3 characters').max(150, 'Title is too long'),
  category: z.string().min(1, 'Choose a category').refine((c) => (CATEGORIES as readonly string[]).includes(c), 'Choose a valid category'),
  blog: z.string().trim().min(10, 'Content must be at least 10 characters'),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
export type BlogValues = z.infer<typeof blogSchema>;

export function validateAvatar(file: File): string | null {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) return 'Only JPG, PNG or WEBP images are allowed.';
  if (file.size > MAX_AVATAR_BYTES) return `Image must be smaller than ${MAX_AVATAR_BYTES / 1024 / 1024} MB.`;
  return null;
}
