import type { Metadata } from 'next';
import { AuthCard } from '@/components/AuthCard';
import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm';

export const metadata: Metadata = { title: 'Forgot password' };

export default function ForgotPasswordPage() {
  return <AuthCard title="Forgot password?" subtitle="Enter your email and we'll send you a reset link."><ForgotPasswordForm /></AuthCard>;
}
