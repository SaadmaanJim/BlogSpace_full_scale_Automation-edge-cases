'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Fields';
import { Alert } from '@/components/ui/Feedback';
import { getErrorMessage } from '@/lib/errors';
import { resetPasswordSchema, type ResetPasswordValues } from '@/lib/validation';
import { authService } from '@/services/auth.service';

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async ({ password }: ResetPasswordValues) => {
    setServerError(null);
    try { await authService.resetPassword(token, password); router.push('/login?reset=1'); }
    catch (error) { setServerError(getErrorMessage(error)); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && <Alert>{serverError}</Alert>}
      <Input label="New Password" type="password" autoComplete="new-password" {...register('password')} error={errors.password?.message} />
      <Input label="Confirm Password" type="password" autoComplete="new-password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
      <Button type="submit" fullWidth loading={isSubmitting} loadingText="Resetting..." data-testid="reset-submit">Reset Password</Button>
    </form>
  );
}
