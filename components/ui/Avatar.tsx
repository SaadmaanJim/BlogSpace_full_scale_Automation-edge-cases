'use client';
import { useEffect, useState } from 'react';
import { initialsOf } from '@/lib/format';
import { cn } from '@/lib/cn';

const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-24 w-24 text-2xl' };

/** Shows the uploaded image; falls back to an initials badge (the "default avatar") if missing or broken. */
export function Avatar({ src, name, size = 'md' }: { src?: string | null; name: string; size?: keyof typeof sizes }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (src && !failed) {
    return <img src={src} alt={name} onError={() => setFailed(true)} data-testid="avatar-image" className={cn('rounded-full object-cover', sizes[size])} />;
  }
  return (
    <span aria-label={name} data-testid="avatar-fallback" className={cn('inline-flex items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700', sizes[size])}>
      {initialsOf(name)}
    </span>
  );
}
