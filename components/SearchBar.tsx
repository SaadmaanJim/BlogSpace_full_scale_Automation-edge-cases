'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/** Pushes ?title= to the home page, keeping an active category when already on "/". */
export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get('title') ?? '');
  useEffect(() => setQuery(params.get('title') ?? ''), [params]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams();
    if (query.trim()) next.set('title', query.trim());
    const category = params.get('category');
    if (pathname === '/' && category) next.set('category', category);
    const qs = next.toString();
    router.push(qs ? `/?${qs}` : '/');
  };

  return (
    <form onSubmit={onSubmit} role="search" className="w-full">
      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search blogs..." aria-label="Search blogs" data-testid="search-input"
        className="w-full rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200" />
    </form>
  );
}
