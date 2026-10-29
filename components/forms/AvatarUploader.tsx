'use client';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { fullName } from '@/lib/format';
import { validateAvatar } from '@/lib/validation';
import { userService } from '@/services/user.service';

export function AvatarUploader() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!user) return null;

  const onChoose = (e: ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0] ?? null;
    const problem = chosen ? validateAvatar(chosen) : null;
    setError(problem);
    setFile(problem ? null : chosen);
  };

  const onUpload = async () => {
    if (!file) return;
    setUploading(true); setError(null);
    try {
      await userService.uploadAvatar(file);
      await refreshUser({ bustAvatarCache: true }); // updates Profile page AND Navbar without re-login
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      toast.success('Profile image updated.');
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setUploading(false); }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">Profile Image</h2>
      <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Avatar src={preview ?? user.profileImage} name={fullName(user)} size="lg" />
        <div className="space-y-3">
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onChoose} data-testid="avatar-input" className="block text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200" />
          <Button onClick={onUpload} disabled={!file} loading={uploading} loadingText="Uploading..." data-testid="avatar-upload">Upload</Button>
        </div>
      </div>
      {error && <div className="mt-4"><Alert testId="avatar-error">{error}</Alert></div>}
    </section>
  );
}
