'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { findActiveHref, getSidebarItems } from '@/lib/navigation';
import { cn } from '@/lib/cn';

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  if (!user) return null;

  const items = getSidebarItems(user.role);
  const activeHref = findActiveHref(items, pathname);
  const linkBase = 'block rounded-lg px-3 py-2 text-sm font-medium transition';

  return (
    <>
      {open && <div className="fixed inset-0 top-16 z-20 bg-black/30 lg:hidden" onClick={onClose} aria-hidden />}
      <aside aria-label="Sidebar" data-testid="sidebar" className={cn('fixed bottom-0 left-0 top-16 z-30 flex w-64 flex-col border-r border-slate-200 bg-white p-3 transition-transform lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <nav className="flex-1 space-y-1">
          {items.map((item) => (
            <Link key={item.key} href={item.href} onClick={onClose} data-testid={`sidebar-${item.key}`} aria-current={item.href === activeHref ? 'page' : undefined}
              className={cn(linkBase, item.href === activeHref ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100')}>
              {item.label}
            </Link>
          ))}
        </nav>
        <button type="button" onClick={logout} data-testid="sidebar-logout" className={cn(linkBase, 'text-left text-red-600 hover:bg-red-50')}>Logout</button>
      </aside>
    </>
  );
}
