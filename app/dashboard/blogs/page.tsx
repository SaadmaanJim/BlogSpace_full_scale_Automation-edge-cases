import type { Metadata } from 'next';
import { BlogsManagement } from '@/components/views/BlogsManagement';

export const metadata: Metadata = { title: 'Blogs' };

export default function Page() {
  return <BlogsManagement />;
}
