import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthCard } from '@/components/AuthCard';
import { LoginForm } from '@/components/forms/LoginForm';

export const metadata: Metadata = { title: 'Login' };

export default function LoginPage() {
  return <AuthCard title="Welcome back" subtitle="Log in to manage your blogs."><Suspense><LoginForm /></Suspense></AuthCard>;
}
