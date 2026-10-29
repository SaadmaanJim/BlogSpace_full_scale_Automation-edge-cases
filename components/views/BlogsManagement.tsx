'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button, buttonStyles } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Alert, EmptyState, Loader } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import { canManage, isOwner, sortNewestFirst } from '@/lib/blogs';
import { getErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/format';
import { blogService } from '@/services/blog.service';
import type { Blog } from '@/types';

export function BlogsManagement() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const { data, error, loading, reload } = useFetch((s) => blogService.list({}, s), []);
  const [pending, setPending] = useState<Blog | null>(null);
  const [deleting, setDeleting] = useState(false);
  if (!user) return null;

  const rows = sortNewestFirst((data ?? []).filter((b) => isAdmin || isOwner(b, user)));

  const confirmDelete = async () => {
    if (!pending) return;
    setDeleting(true);
    try {
      await blogService.remove(pending.id);
      toast.success('Blog deleted.');
      setPending(null);
      reload();
    } catch (e) { toast.error(getErrorMessage(e)); setPending(null); }
    finally { setDeleting(false); }
  };

  const columns: Column<Blog>[] = [
    { key: 'title', header: 'Title', render: (b) => <Link href={`/blogs/${b.id}`} className="font-medium text-slate-800 hover:text-indigo-600">{b.title}</Link> },
    { key: 'category', header: 'Category', render: (b) => b.category },
    { key: 'author', header: 'Author', render: (b) => b.author.name },
    { key: 'created', header: 'Created', render: (b) => formatDate(b.createdAt) },
    { key: 'actions', header: 'Actions', render: (b) => canManage(b, user) && (
      <div className="flex gap-2">
        <Link href={`/dashboard/blogs/${b.id}/edit`} className={buttonStyles('secondary', 'px-3 py-1')} data-testid={`edit-${b.id}`}>Edit</Link>
        <Button variant="danger" className="px-3 py-1" onClick={() => setPending(b)} data-testid={`delete-${b.id}`}>Delete</Button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{isAdmin ? 'All Blogs' : 'My Blogs'}</h1>
        <Link href="/dashboard/blogs/create" className={buttonStyles('primary')}>+ Create Blog</Link>
      </div>
      {loading ? <Loader label="Loading blogs..." /> : error ? <Alert>{error}</Alert> : rows.length === 0 ? (
        <EmptyState title={isAdmin ? 'No blogs found.' : "You haven't created any blogs yet."} />
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(b) => b.id} testId="blogs-table" />
      )}
      <ConfirmDialog open={pending !== null} message="Are you sure you want to delete this blog?" loading={deleting} onConfirm={confirmDelete} onCancel={() => setPending(null)} />
    </div>
  );
}
