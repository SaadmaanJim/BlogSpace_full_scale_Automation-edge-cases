import type { Metadata } from 'next';
import { EditBlogView } from '@/components/views/EditBlogView';

export const metadata: Metadata = { title: 'Edit blog' };

export default function EditBlogPage({ params }: { params: { id: string } }) {
  return <EditBlogView id={params.id} />;
}
