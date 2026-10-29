import type { Metadata } from 'next';
import { CreateBlogView } from '@/components/views/CreateBlogView';

export const metadata: Metadata = { title: 'Create blog' };

export default function Page() {
  return <CreateBlogView />;
}
