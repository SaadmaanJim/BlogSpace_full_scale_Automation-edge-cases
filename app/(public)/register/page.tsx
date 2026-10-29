import type { Metadata } from 'next';
import { AuthCard } from '@/components/AuthCard';
import { RegisterForm } from '@/components/forms/RegisterForm';

export const metadata: Metadata = { title: 'Register' };

export default function RegisterPage() {
  return <AuthCard title="Create your account" subtitle="Join to start writing."><RegisterForm /></AuthCard>;
}
