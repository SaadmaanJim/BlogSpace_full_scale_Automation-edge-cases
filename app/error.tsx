'use client';
import { Button } from '@/components/ui/Button';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center" data-testid="error-page">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-sm text-slate-600">{error.message || 'An unexpected error occurred.'}</p>
      <Button className="mt-5" onClick={reset}>Try again</Button>
    </div>
  );
}
