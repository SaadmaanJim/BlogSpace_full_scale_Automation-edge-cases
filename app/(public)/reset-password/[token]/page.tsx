import type { Metadata } from 'next';
import { AuthCard } from '@/components/AuthCard';
import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm';

export const metadata: Metadata = { title: 'Reset password' };

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  return <AuthCard title="Reset password" subtitle="Choose a new password."><ResetPasswordForm token={params.token} /></AuthCard>;
}
