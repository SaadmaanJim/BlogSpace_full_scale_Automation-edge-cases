import type { Role } from '@/types';

export interface NavItem { key: string; label: string; href: string }

export function getSidebarItems(role: Role): NavItem[] {
  const isAdmin = role === 'admin';
  return [
    { key: 'dashboard', label: 'Dashboard', href: '/dashboard' },
    { key: 'blogs', label: isAdmin ? 'All Blogs' : 'My Blogs', href: '/dashboard/blogs' },
    { key: 'create-blog', label: 'Create Blog', href: '/dashboard/blogs/create' },
    ...(isAdmin ? [{ key: 'users', label: 'Users', href: '/admin/users' }] : []),
    { key: 'profile', label: 'Profile', href: '/dashboard/profile' },
    { key: 'change-password', label: 'Change Password', href: '/dashboard/change-password' },
  ];
}

// Longest matching href wins, so /dashboard/blogs/create doesn't also light up "My Blogs".
export function findActiveHref(items: NavItem[], pathname: string): string | undefined {
  return items
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

// Only same-site relative paths are allowed as post-login redirect (prevents open redirects).
export function safeNextPath(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
}
