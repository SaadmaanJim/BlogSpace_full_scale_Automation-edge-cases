'use client';
import { useSearchParams } from 'next/navigation';
import { BlogCard, BlogCardSkeleton } from '@/components/BlogCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Alert, EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { useFetch } from '@/hooks/useFetch';
import { blogService } from '@/services/blog.service';

/** Reads ?title= and ?category= from the URL (shareable, back-button friendly) and asks the API to filter. */
export function BlogExplorer() {
  const params = useSearchParams();
  const title = params.get('title') ?? '';
  const category = params.get('category') ?? '';
  const { data, error, loading, reload } = useFetch(
    (signal) => blogService.list({ title: title || undefined, category: category || undefined }, signal),
    [title, category],
  );

  return (
    <section className="space-y-6">
      <CategoryFilter selected={category} />
      {loading && (
        <div>
          <p className="mb-3 text-sm text-slate-500">Loading blogs...</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <BlogCardSkeleton key={i} />)}</div>
        </div>
      )}
      {!loading && error && (
        <div className="space-y-3"><Alert>{error}</Alert><Button variant="secondary" onClick={reload}>Try again</Button></div>
      )}
      {!loading && !error && data && data.length === 0 && (
        <EmptyState title="No blogs found." description={title || category ? 'Try a different search or category.' : 'Check back soon.'} />
      )}
      {!loading && !error && data && data.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="blog-grid">{data.map((b) => <BlogCard key={b.id} blog={b} />)}</div>
      )}
    </section>
  );
}
