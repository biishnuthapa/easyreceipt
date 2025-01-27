import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: '2QuickPaper - Digital Receipts Platform',
  description: 'Send digital receipts via email and WhatsApp',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}