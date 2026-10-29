import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { excerpt } from '@/lib/blogs';
import { formatDate } from '@/lib/format';
import type { Blog } from '@/types';

export function BlogCard({ blog }: { blog: Blog }) {
  return (
    <article data-testid="blog-card" className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      {blog.category && <span className="mb-3 w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">{blog.category}</span>}
      <h3 className="text-lg font-semibold text-slate-900">{blog.title}</h3>
      <p className="mt-2 flex-1 text-sm text-slate-600">{excerpt(blog.content)}</p>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar src={blog.author.image} name={blog.author.name} size="sm" />
          <div className="min-w-0 text-xs">
            <p className="truncate font-medium text-slate-700">{blog.author.name}</p>
            <p className="text-slate-500">{formatDate(blog.createdAt)}</p>
          </div>
        </div>
        <Link href={`/blogs/${blog.id}`} className="shrink-0 text-sm font-medium text-indigo-600 hover:underline">Read More →</Link>
      </div>
    </article>
  );
}

export function BlogCardSkeleton() {
  return <div aria-hidden className="h-52 animate-pulse rounded-xl border border-slate-200 bg-white" />;
}
