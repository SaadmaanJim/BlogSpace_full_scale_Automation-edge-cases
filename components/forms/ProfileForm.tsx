'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Fields';
import { Alert } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { profileSchema, type ProfileValues } from '@/lib/validation';
import { userService } from '@/services/user.service';

/** Edits first/last name only. Role and isActive have no controls here by design. */
export function ProfileForm() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstname: user?.firstname ?? '', lastname: user?.lastname ?? '' },
  });

  const onSubmit = async (values: ProfileValues) => {
    setServerError(null);
    try { await userService.updateProfile(values); await refreshUser(); toast.success('Profile updated.'); }
    catch (error) { setServerError(getErrorMessage(error)); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">Edit Profile</h2>
      {serverError && <Alert>{serverError}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="First Name" {...register('firstname')} error={errors.firstname?.message} />
        <Input label="Last Name" {...register('lastname')} error={errors.lastname?.message} />
      </div>
      <Input label="Email" name="email" value={user?.email ?? ''} readOnly disabled hint="Email cannot be changed." />
      <Input label="Role" name="role" value={user?.role ?? ''} readOnly disabled />
      <Button type="submit" loading={isSubmitting} loadingText="Saving..." data-testid="profile-submit">Save Changes</Button>
    </form>
  );
}
