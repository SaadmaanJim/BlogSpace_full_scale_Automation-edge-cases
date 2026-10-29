import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Loader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div role="status" data-testid="loader" className="flex items-center justify-center gap-3 py-10 text-sm text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" aria-hidden />
      {label}
    </div>
  );
}
export const FullPageLoader = () => <div className="flex min-h-screen items-center justify-center"><Loader /></div>;

const alertStyles = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-green-200 bg-green-50 text-green-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
};
export function Alert({ variant = 'error', children, testId = 'form-error' }: { variant?: keyof typeof alertStyles; children: ReactNode; testId?: string }) {
  return <div role="alert" data-testid={testId} className={cn('rounded-lg border px-4 py-3 text-sm', alertStyles[variant])}>{children}</div>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div data-testid="empty-state" className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
