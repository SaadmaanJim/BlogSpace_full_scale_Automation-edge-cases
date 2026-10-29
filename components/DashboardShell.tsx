'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AuthGuard, RoleGate } from '@/components/AuthGuard';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import type { Role } from '@/types';

export function DashboardShell({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setDrawerOpen(false), [pathname]);

  return (
    <AuthGuard>
      <Navbar onMenuClick={() => setDrawerOpen(true)} />
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main className="min-h-screen pt-16 lg:pl-64">
        <div className="mx-auto max-w-6xl p-4 sm:p-6"><RoleGate roles={roles}>{children}</RoleGate></div>
      </main>
    </AuthGuard>
  );
}
