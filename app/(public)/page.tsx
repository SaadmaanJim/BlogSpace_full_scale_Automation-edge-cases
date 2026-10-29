import { Suspense } from 'react';
import { BlogExplorer } from '@/components/views/BlogExplorer';
import { Loader } from '@/components/ui/Feedback';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Discover stories worth reading</h1>
        <p className="mt-2 max-w-2xl text-slate-600">Browse the latest posts, search by title, or filter by category.</p>
      </section>
      <Suspense fallback={<Loader label="Loading blogs..." />}><BlogExplorer /></Suspense>
    </div>
  );
}
