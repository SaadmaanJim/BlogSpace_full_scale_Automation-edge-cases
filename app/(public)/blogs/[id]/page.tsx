import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { ApiError } from '@/lib/api/client';
import { APP_NAME } from '@/lib/config';
import { formatDate } from '@/lib/format';
import { blogService } from '@/services/blog.service';

// Server Component: fetched on the server (SEO + no loading flash). cache() dedupes the call shared with generateMetadata.
const loadBlog = cache(async (id: string) => {
  try { return await blogService.getById(id); }
  catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
});

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const blog = await loadBlog(params.id).catch(() => null);
  return { title: blog ? blog.title : `Blog not found · ${APP_NAME}` };
}

export default async function BlogDetailsPage({ params }: { params: { id: string } }) {
  const blog = await loadBlog(params.id);
  if (!blog) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-10" data-testid="blog-details">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">← Back to blogs</Link>
      {blog.category && <p className="mt-6"><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">{blog.category}</span></p>}
      <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">{blog.title}</h1>
      <div className="mt-4 flex items-center gap-3 border-b border-slate-200 pb-6">
        <Avatar src={blog.author.image} name={blog.author.name} />
        <div className="text-sm"><p className="font-medium text-slate-800">{blog.author.name}</p><p className="text-slate-500">{formatDate(blog.createdAt)}</p></div>
      </div>
      {/* Rendered as text (React escapes it), so user-written HTML can never execute. */}
      <div className="mt-6 whitespace-pre-wrap break-words leading-relaxed text-slate-700">{blog.content}</div>
    </article>
  );
}
