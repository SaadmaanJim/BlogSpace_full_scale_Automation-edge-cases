'use client';
import { useRouter } from 'next/navigation';
import { BlogForm } from '@/components/BlogForm';
import { useToast } from '@/components/ui/Toast';
import { blogService } from '@/services/blog.service';
import type { BlogValues } from '@/lib/validation';

export function CreateBlogView() {
  const router = useRouter();
  const toast = useToast();
  const create = async (values: BlogValues) => {
    await blogService.create(values);
    toast.success('Blog published.');
    router.push('/dashboard/blogs');
  };
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Create Blog</h1>
      <BlogForm submitLabel="Publish Blog" pendingLabel="Publishing..." onSubmit={create} />
    </div>
  );
}
