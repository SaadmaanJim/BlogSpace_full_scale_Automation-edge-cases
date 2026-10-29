'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { CATEGORIES } from '@/lib/config';
import { cn } from '@/lib/cn';

export function CategoryFilter({ selected }: { selected: string }) {
  const router = useRouter();
  const params = useSearchParams();

  const choose = (category: string) => {
    const next = new URLSearchParams(params.toString());
    if (category) next.set('category', category); else next.delete('category');
    const qs = next.toString();
    router.push(qs ? `/?${qs}` : '/');
  };

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
      {['All', ...CATEGORIES].map((name) => {
        const value = name === 'All' ? '' : name;
        const active = selected === value;
        return (
          <button key={name} type="button" onClick={() => choose(value)} aria-pressed={active} data-testid={`category-${name}`}
            className={cn('rounded-full border px-4 py-1.5 text-sm transition', active ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50')}>
            {name}
          </button>
        );
      })}
    </div>
  );
}
