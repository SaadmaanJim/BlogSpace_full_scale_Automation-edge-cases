'use client';
import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { buttonStyles } from '@/components/ui/Button';
import { FullPageLoader } from '@/components/ui/Feedback';
import { useAuth } from '@/contexts/AuthContext';
import type { Role } from '@/types';

export function AccessDenied({ message = 'You do not have permission to view this page.' }: { message?: string }) {
  return (
    <div data-testid="access-denied" className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
      <h1 className="text-xl font-semibold text-slate-900">Access Denied</h1>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
      <Link href="/dashboard" className={buttonStyles('primary', 'mt-5')}>Back to Dashboard</Link>
    </div>
  );
}

/** Requires a logged-in user; otherwise redirects to /login and remembers where they were going. */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, status, endReason } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== 'unauthenticated') return;
    if (endReason === 'logout') { router.replace('/login'); return; } // deliberate logout: don't remember the page
    const params = new URLSearchParams();
    if (endReason === 'expired') params.set('expired', '1');
    params.set('next', pathname);
    router.replace(`/login?${params.toString()}`);
  }, [status, endReason, pathname, router]);

  if (status !== 'authenticated' || !user) return <FullPageLoader />;
  return <>{children}</>;
}

/** UI-level role check. The backend still enforces roles; this just avoids showing pages that would 403. */
export function RoleGate({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { user } = useAuth();
  if (roles && user && !roles.includes(user.role)) return <AccessDenied />;
  return <>{children}</>;
}
