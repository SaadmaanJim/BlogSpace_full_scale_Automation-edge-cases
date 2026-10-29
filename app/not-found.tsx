import Link from 'next/link';
import { buttonStyles } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600">The page you are looking for doesn&apos;t exist.</p>
      <Link href="/" className={buttonStyles('primary', 'mt-5')}>Go home</Link>
    </div>
  );
}
