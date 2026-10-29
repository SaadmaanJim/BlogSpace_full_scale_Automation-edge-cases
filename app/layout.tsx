import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { APP_NAME } from '@/lib/config';
import './globals.css';

export const metadata: Metadata = {
  title: { default: `${APP_NAME} — Read and share blogs`, template: `%s · ${APP_NAME}` },
  description: 'A blog platform built with Next.js and Tailwind CSS.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider><AuthProvider>{children}</AuthProvider></ToastProvider>
      </body>
    </html>
  );
}
