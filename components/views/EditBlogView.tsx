'use client';
import { useRouter } from 'next/navigation';
import { AccessDenied } from '@/components/AuthGuard';
import { BlogForm } from '@/components/BlogForm';
import { Alert, EmptyState, Loader } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import { canManage } from '@/lib/blogs';
import type { BlogValues } from '@/lib/validation';
import { blogService } from '@/services/blog.service';

export function EditBlogView({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { data: blog, error, status, loading } = useFetch((s) => blogService.getById(id, s), [id]);

  if (loading) return <Loader label="Loading blog..." />;
  if (status === 404 || status === 400) return <EmptyState title="Blog Not Found" description="This blog doesn't exist or was deleted." />;
  if (error || !blog || !user) return <Alert>{error ?? 'Unable to load this blog.'}</Alert>;
  if (!canManage(blog, user)) return <AccessDenied message="You are not authorized to update this blog." />;

  const save = async (values: BlogValues) => {
    await blogService.update(id, values);
    toast.success('Blog updated.');
    router.push('/dashboard/blogs');
  };
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Edit Blog</h1>
      <BlogForm initialValues={{ blogTitle: blog.title, category: blog.category, blog: blog.content }} submitLabel="Save Changes" pendingLabel="Saving..." onSubmit={save} />
    </div>
  );
}
