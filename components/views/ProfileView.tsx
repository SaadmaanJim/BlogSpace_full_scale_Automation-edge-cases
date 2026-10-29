'use client';
import { AvatarUploader } from '@/components/forms/AvatarUploader';
import { ProfileForm } from '@/components/forms/ProfileForm';

export function ProfileView() {
  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
      <AvatarUploader />
      <ProfileForm />
    </div>
  );
}
