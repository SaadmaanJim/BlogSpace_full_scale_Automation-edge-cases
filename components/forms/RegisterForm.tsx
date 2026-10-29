'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Fields';
import { Alert } from '@/components/ui/Feedback';
import { getErrorMessage } from '@/lib/errors';
import { registerSchema, type RegisterValues } from '@/lib/validation';
import { authService } from '@/services/auth.service';

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async ({ firstname, lastname, email, password }: RegisterValues) => {
    setServerError(null);
    try {
      await authService.register({ firstname, lastname, email, password }); // confirmPassword never leaves the browser
      router.push('/login?registered=1');
    } catch (error) { setServerError(getErrorMessage(error)); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && <Alert>{serverError}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="First Name" autoComplete="given-name" {...register('firstname')} error={errors.firstname?.message} />
        <Input label="Last Name" autoComplete="family-name" {...register('lastname')} error={errors.lastname?.message} />
      </div>
      <Input label="Email" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
      <Input label="Password" type="password" autoComplete="new-password" {...register('password')} error={errors.password?.message} />
      <Input label="Confirm Password" type="password" autoComplete="new-password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
      <Button type="submit" fullWidth loading={isSubmitting} loadingText="Creating account..." data-testid="register-submit">Register</Button>
      <p className="text-center text-sm text-slate-500">Already registered? <Link href="/login" className="text-indigo-600 hover:underline">Login</Link></p>
    </form>
  );
}
