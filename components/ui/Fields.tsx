import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const control = 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-500';
const ok = 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200';
const bad = 'border-red-400 focus:border-red-500 focus:ring-red-200';

interface FieldProps { label: string; error?: string; hint?: string }

function Wrapper({ label, error, hint, id, name, children }: FieldProps & { id: string; name?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" data-testid={`${name ?? id}-error`} className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldProps>(
  ({ label, error, hint, className, ...rest }, ref) => {
    const id = rest.id ?? rest.name ?? label;
    return (
      <Wrapper label={label} error={error} hint={hint} id={id} name={rest.name}>
        <input ref={ref} id={id} data-testid={`field-${rest.name ?? id}`} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={cn(control, error ? bad : ok, className)} {...rest} />
      </Wrapper>
    );
  },
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps>(
  ({ label, error, hint, className, ...rest }, ref) => {
    const id = rest.id ?? rest.name ?? label;
    return (
      <Wrapper label={label} error={error} hint={hint} id={id} name={rest.name}>
        <textarea ref={ref} id={id} data-testid={`field-${rest.name ?? id}`} aria-invalid={Boolean(error)} className={cn(control, error ? bad : ok, className)} {...rest} />
      </Wrapper>
    );
  },
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & FieldProps>(
  ({ label, error, hint, className, children, ...rest }, ref) => {
    const id = rest.id ?? rest.name ?? label;
    return (
      <Wrapper label={label} error={error} hint={hint} id={id} name={rest.name}>
        <select ref={ref} id={id} data-testid={`field-${rest.name ?? id}`} aria-invalid={Boolean(error)} className={cn(control, error ? bad : ok, className)} {...rest}>{children}</select>
      </Wrapper>
    );
  },
);
Select.displayName = 'Select';
