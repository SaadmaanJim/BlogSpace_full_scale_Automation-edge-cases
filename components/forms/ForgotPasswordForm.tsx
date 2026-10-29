'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Fields';
import { Alert } from '@/components/ui/Feedback';
import { getErrorMessage } from '@/lib/errors';
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/lib/validation';
import { authService } from '@/services/auth.service';

export function ForgotPasswordForm() {
  const [success, setSuccess] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async ({ email }: ForgotPasswordValues) => {
    setServerError(null); setSuccess(null);
    try { setSuccess(await authService.forgotPassword(email)); } catch (error) { setServerError(getErrorMessage(error)); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {success && <Alert variant="success" testId="form-success">{success}</Alert>}
      {serverError && <Alert>{serverError}</Alert>}
      <Input label="Email" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
      <Button type="submit" fullWidth loading={isSubmitting} loadingText="Sending..." data-testid="forgot-submit">Send Reset Link</Button>
      <p className="text-center text-sm"><Link href="/login" className="text-indigo-600 hover:underline">Back to Login</Link></p>
    </form>
  );
}
