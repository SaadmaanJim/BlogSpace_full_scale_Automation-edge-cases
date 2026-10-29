import type { Metadata } from 'next';
import { ChangePasswordForm } from '@/components/forms/ChangePasswordForm';

export const metadata: Metadata = { title: 'Change password' };

export default function ChangePasswordPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Change Password</h1>
      <ChangePasswordForm />
    </div>
  );
}
