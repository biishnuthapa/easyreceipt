import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ReceiptText } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <ReceiptText className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">EasyReceipt</span>
        </div>
        <div className="space-x-4">
          <Link href="/auth/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/auth/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-16 text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          Digital Receipts Made Simple
        </h1>
        <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
          Send professional digital receipts to your customers instantly via email or WhatsApp.
          Save time, reduce paper waste, and keep your business organized.
        </p>
        <div className="mt-10">
          <Link href="/auth/register">
            <Button size="lg" className="mr-4">Start Free</Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline">Learn More</Button>
          </Link>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Easy to Use</h3>
            <p className="text-muted-foreground">
              Create and send receipts in seconds with our intuitive interface.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Multiple Channels</h3>
            <p className="text-muted-foreground">
              Send receipts via email or WhatsApp based on your customer's preference.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Professional Look</h3>
            <p className="text-muted-foreground">
              Customize receipts with your company logo and digital signature.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}