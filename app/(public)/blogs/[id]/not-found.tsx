import Link from 'next/link';
import { buttonStyles } from '@/components/ui/Button';

export default function BlogNotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center" data-testid="blog-not-found">
      <h1 className="text-2xl font-bold">Blog Not Found</h1>
      <p className="mt-2 text-sm text-slate-600">This blog doesn&apos;t exist or has been removed.</p>
      <Link href="/" className={buttonStyles('primary', 'mt-5')}>Browse blogs</Link>
    </div>
  );
}
