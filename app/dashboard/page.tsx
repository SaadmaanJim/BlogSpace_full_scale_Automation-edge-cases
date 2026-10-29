import type { Metadata } from 'next';
import { DashboardOverview } from '@/components/views/DashboardOverview';

export const metadata: Metadata = { title: 'Dashboard' };

export default function Page() {
  return <DashboardOverview />;
}
