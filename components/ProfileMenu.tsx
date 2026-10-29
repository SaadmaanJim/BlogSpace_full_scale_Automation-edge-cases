'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { fullName } from '@/lib/format';

export function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [open]);

  if (!user) return null;
  const name = fullName(user);
  const item = 'block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50';

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} data-testid="profile-menu-button" className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100">
        <Avatar src={user.profileImage} name={name} size="sm" />
        <span className="hidden max-w-[8rem] truncate text-sm font-medium text-slate-700 sm:inline" data-testid="navbar-username">{name}</span>
        <span aria-hidden className="text-xs text-slate-500">▾</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <Link role="menuitem" href="/dashboard/profile" className={item} onClick={() => setOpen(false)}>Profile</Link>
          <Link role="menuitem" href="/dashboard/change-password" className={item} onClick={() => setOpen(false)}>Change Password</Link>
          <button role="menuitem" type="button" className={`${item} text-red-600`} onClick={() => { setOpen(false); logout(); }} data-testid="logout-menu">Logout</button>
        </div>
      )}
    </div>
  );
}
