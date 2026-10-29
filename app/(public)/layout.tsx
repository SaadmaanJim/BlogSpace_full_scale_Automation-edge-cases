import type { ReactNode } from 'react';
import { Navbar } from '@/components/Navbar';
import { APP_NAME } from '@/lib/config';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] pt-16">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</footer>
    </>
  );
}
