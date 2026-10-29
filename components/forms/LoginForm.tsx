'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Fields';
import { Alert } from '@/components/ui/Feedback';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { safeNextPath } from '@/lib/navigation';
import { loginSchema, type LoginValues } from '@/lib/validation';

export function LoginForm() {
  const { login, status } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get('next'));
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  // Once authenticated (after submit OR if already logged in) go where the user was heading.
  useEffect(() => { if (status === 'authenticated') router.replace(next); }, [status, next, router]);

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    try { await login(values.email, values.password); } catch (error) { setServerError(getErrorMessage(error)); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {params.get('registered') && <Alert variant="success" testId="notice">Account created. Please log in.</Alert>}
      {params.get('reset') && <Alert variant="success" testId="notice">Password successfully changed. Please log in.</Alert>}
      {params.get('expired') && <Alert variant="info" testId="notice">Your session expired. Please log in again.</Alert>}
      {serverError && <Alert>{serverError}</Alert>}
      <Input label="Email" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
      <Input label="Password" type="password" autoComplete="current-password" {...register('password')} error={errors.password?.message} />
      <div className="text-right text-sm"><Link href="/forgot-password" className="text-indigo-600 hover:underline">Forgot Password?</Link></div>
      <Button type="submit" fullWidth loading={isSubmitting} loadingText="Logging in..." data-testid="login-submit">Login</Button>
      <p className="text-center text-sm text-slate-500">No account? <Link href="/register" className="text-indigo-600 hover:underline">Register</Link></p>
    </form>
  );
}
