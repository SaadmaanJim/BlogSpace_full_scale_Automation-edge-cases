'use client';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { buttonStyles } from '@/components/ui/Button';
import { Alert, EmptyState, Loader } from '@/components/ui/Feedback';
import { useAuth } from '@/contexts/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import { isOwner, sortNewestFirst } from '@/lib/blogs';
import { RECENT_BLOGS_COUNT } from '@/lib/config';
import { formatDate, fullName } from '@/lib/format';
import { blogService } from '@/services/blog.service';
import { userService } from '@/services/user.service';

function Stat({ label, value, testId }: { label: string; value: number | string; testId: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p data-testid={testId} className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export function DashboardOverview() {
  const { user, isAdmin } = useAuth();
  const blogs = useFetch((s) => blogService.list({}, s), []);
  // The API has no "my blogs" or count endpoint, so ownership is derived from GET /blogs.
  const users = useFetch(async (s) => (isAdmin ? userService.list(s) : []), [isAdmin]);
  if (!user) return null;

  const visible = sortNewestFirst((blogs.data ?? []).filter((b) => isAdmin || isOwner(b, user)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 data-testid="dashboard-welcome" className="text-2xl font-bold text-slate-900">Welcome, {user.firstname}</h1>
        <Link href="/dashboard/blogs/create" className={buttonStyles('primary')}>+ Quick Create Blog</Link>
      </div>

      {blogs.loading ? <Loader label="Loading dashboard..." /> : blogs.error ? <Alert>{blogs.error}</Alert> : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label={isAdmin ? 'Total Blogs (all users)' : 'Total Blogs'} value={visible.length} testId="stat-total-blogs" />
            {isAdmin && <Stat label="Total Users" value={users.loading ? '…' : users.data?.length ?? 0} testId="stat-total-users" />}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="mb-3 text-sm text-slate-500">Profile Information</p>
              <div className="flex items-center gap-3">
                <Avatar src={user.profileImage} name={fullName(user)} />
                <div className="min-w-0 text-sm"><p className="truncate font-medium">{fullName(user)}</p><p className="truncate text-slate-500">{user.email}</p><p className="text-xs capitalize text-indigo-600">{user.role}</p></div>
              </div>
            </div>
          </div>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Recent Blogs</h2>
            {visible.length === 0 ? (
              <EmptyState title="You haven't created any blogs yet." action={<Link href="/dashboard/blogs/create" className={buttonStyles('primary')}>Create your first blog</Link>} />
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                {visible.slice(0, RECENT_BLOGS_COUNT).map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                    <Link href={`/blogs/${b.id}`} className="font-medium text-slate-800 hover:text-indigo-600">{b.title}</Link>
                    <span className="text-slate-500">{b.category} · {formatDate(b.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
