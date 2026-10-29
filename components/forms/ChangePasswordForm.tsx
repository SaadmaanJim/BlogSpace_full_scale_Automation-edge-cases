'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Fields';
import { Alert } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/lib/errors';
import { changePasswordSchema, type ChangePasswordValues } from '@/lib/validation';
import { userService } from '@/services/user.service';

export function ChangePasswordForm() {
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = async ({ password }: ChangePasswordValues) => {
    setServerError(null);
    try { await userService.changePassword(password); toast.success('Password changed successfully.'); reset(); }
    catch (error) { setServerError(getErrorMessage(error)); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      {serverError && <Alert>{serverError}</Alert>}
      <Input label="New Password" type="password" autoComplete="new-password" {...register('password')} error={errors.password?.message} />
      <Input label="Confirm New Password" type="password" autoComplete="new-password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
      <Button type="submit" loading={isSubmitting} loadingText="Updating..." data-testid="change-password-submit">Change Password</Button>
    </form>
  );
}
