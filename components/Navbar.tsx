'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { ProfileMenu } from '@/components/ProfileMenu';
import { SearchBar } from '@/components/SearchBar';
import { buttonStyles } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { APP_NAME } from '@/lib/config';

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, status } = useAuth();
  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-slate-200 bg-white">
      <div className="flex h-full items-center gap-3 px-4">
        {onMenuClick && (
          <button type="button" onClick={onMenuClick} aria-label="Open menu" data-testid="sidebar-toggle" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden">☰</button>
        )}
        <Link href="/" className="text-lg font-bold text-indigo-600">{APP_NAME}</Link>
        <div className="mx-auto min-w-0 max-w-md flex-1">
          <Suspense fallback={null}><SearchBar /></Suspense>
        </div>
        {status === 'loading' ? (
          <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-200" aria-hidden />
        ) : user ? (
          <ProfileMenu />
        ) : (
          <nav className="flex items-center gap-2">
            <Link href="/login" className={buttonStyles('ghost')} data-testid="nav-login">Login</Link>
            <Link href="/register" className={buttonStyles('primary', 'hidden sm:inline-flex')} data-testid="nav-register">Register</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
