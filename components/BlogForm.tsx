'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Fields';
import { CATEGORIES } from '@/lib/config';
import { getErrorMessage } from '@/lib/errors';
import { blogSchema, type BlogValues } from '@/lib/validation';

interface Props {
  initialValues?: BlogValues;
  submitLabel: string;
  pendingLabel: string;
  onSubmit: (values: BlogValues) => Promise<void>;
}

/** Shared by Create and Edit. Values are exactly the API payload: no userId is ever included. */
export function BlogForm({ initialValues, submitLabel, pendingLabel, onSubmit }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<BlogValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: initialValues ?? { blogTitle: '', category: '', blog: '' },
  });

  const submit = async (values: BlogValues) => {
    setServerError(null);
    try { await onSubmit(values); } catch (error) { setServerError(getErrorMessage(error)); }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      {serverError && <Alert>{serverError}</Alert>}
      <Input label="Blog Title" {...register('blogTitle')} error={errors.blogTitle?.message} />
      <Select label="Category" {...register('category')} error={errors.category?.message}>
        <option value="">Select a category</option>
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </Select>
      <Textarea label="Blog Content" rows={10} {...register('blog')} error={errors.blog?.message} />
      <Button type="submit" loading={isSubmitting} loadingText={pendingLabel} data-testid="blog-submit">{submitLabel}</Button>
    </form>
  );
}
