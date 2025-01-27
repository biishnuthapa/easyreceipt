'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ReceiptText, LayoutDashboard, FileText, LogOut, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ReceiptText className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">EasyReceipt</span>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="h-5 w-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 flex gap-8">
        <aside className="w-64 shrink-0">
          <nav className="space-y-2">
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full justify-start">
                <LayoutDashboard className="h-5 w-5 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/receipts">
              <Button variant="ghost" className="w-full justify-start">
                <FileText className="h-5 w-5 mr-2" />
                Receipts
              </Button>
            </Link>
            <Link href="/dashboard/customers">
              <Button variant="ghost" className="w-full justify-start">
                <Users className="h-5 w-5 mr-2" />
                Customers
              </Button>
            </Link>
          </nav>
        </aside>

        <main className="flex-1">{children}</main>
      </div>

      <footer className="border-t mt-auto py-4">
        <div className="container mx-auto px-6 text-center text-sm text-gray-600">
          Made with ❤️ by <a href="https://www.bishnu.info.np" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Bishnu Thapa</a>
        </div>
      </footer>
    </div>
  );
}