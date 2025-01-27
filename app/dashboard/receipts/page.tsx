'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Download, FileText, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { generatePDF } from '@/lib/generatePDF';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/lib/supabase/types';

type Receipt = Database['public']['Tables']['receipts']['Row'];

export default function ReceiptsPage() {
  const { toast } = useToast();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    loadReceipts();
  }, [fromDate, toDate, selectedPaymentMethod]);

  async function loadReceipts() {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Authentication required');
      }

      let query = supabase
        .from('receipts')
        .select()
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

      if (fromDate) {
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);
        query = query.gte('created_at', startDate.toISOString());
      }

      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      if (selectedPaymentMethod && selectedPaymentMethod !== 'all') {
        query = query.eq('payment_method', selectedPaymentMethod);
      }

      const { data, error } = await query;
      
      if (error) {
        throw error;
      }

      setReceipts(data || []);
    } catch (error) {
      console.error('Error loading receipts:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load receipts',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleDownload = async (receipt: Receipt) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_name, company_logo')
        .eq('id', receipt.profile_id)
        .single();

      if (profileError) {
        throw profileError;
      }

      const pdfData = {
        receiptNumber: receipt.receipt_number || '',
        date: format(new Date(receipt.created_at), 'PPP'),
        customerName: receipt.customer_name,
        customerNumber: receipt.customer_number || '',
        customerAddress: receipt.customer_address || '',
        companyName: profile?.company_name || 'Company Name',
        companyLogo: profile?.company_logo || '',
        items: receipt.items as any[],
        currency: receipt.currency || 'NRs',
        subtotal: receipt.subtotal,
        taxRate: receipt.tax_rate || 0,
        tax: receipt.tax,
        total: receipt.total,
        paymentMethod: receipt.payment_method,
        signature: receipt.signature,
        title: receipt.title
      };

      const pdfDataUrl = await generatePDF(pdfData);
      const link = document.createElement('a');
      link.href = pdfDataUrl;
      link.download = `receipt-${receipt.receipt_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to download receipt',
      });
    }
  };

  const showDetails = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setIsDetailsOpen(true);
  };

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setSelectedPaymentMethod('all');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Receipts</h1>
          <Link href="/dashboard/receipts/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Receipt
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">From Date</label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">To Date</label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Payment Method</label>
                <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="secondary" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sl.No</TableHead>
                  <TableHead>Receipt No</TableHead>
                  <TableHead>Recipient Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Receipt Send</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : receipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No receipts found for this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  receipts.map((receipt, index) => (
                    <TableRow key={receipt.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{receipt.receipt_number}</TableCell>
                      <TableCell>{receipt.customer_name}</TableCell>
                      <TableCell>
                        {format(new Date(receipt.created_at), 'MMMM do, yyyy')}
                      </TableCell>
                      <TableCell>
                        {receipt.currency || 'NRs'} {receipt.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="capitalize">
                        {receipt.payment_method}
                      </TableCell>
                      <TableCell>
                        {receipt.sent_via === 'email' || receipt.sent_via === 'whatsapp' ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(receipt)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => showDetails(receipt)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {receipts.length > 0 && (
              <div className="mt-4 text-sm text-muted-foreground">
                Showing {receipts.length} receipts
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Receipt Number</h4>
                  <p>{selectedReceipt.receipt_number}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Date</h4>
                  <p>{format(new Date(selectedReceipt.created_at), 'PPP')}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold">Customer Information</h4>
                <p>Name: {selectedReceipt.customer_name}</p>
                {selectedReceipt.customer_number && (
                  <p>Number: {selectedReceipt.customer_number}</p>
                )}
                {selectedReceipt.customer_address && (
                  <p>Address: {selectedReceipt.customer_address}</p>
                )}
                {selectedReceipt.customer_email && (
                  <p>Email: {selectedReceipt.customer_email}</p>
                )}
                {selectedReceipt.customer_whatsapp && (
                  <p>WhatsApp: {selectedReceipt.customer_whatsapp}</p>
                )}
              </div>

              <div>
                <h4 className="font-semibold">Items</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedReceipt.items as any[]).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{selectedReceipt.currency} {item.price.toFixed(2)}</TableCell>
                        <TableCell>{selectedReceipt.currency} {(item.price * item.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Payment Details</h4>
                  <p>Method: {selectedReceipt.payment_method}</p>
                  <p>Sent via: {selectedReceipt.sent_via}</p>
                </div>
                <div className="text-right">
                  <p>Subtotal: {selectedReceipt.currency} {selectedReceipt.subtotal.toFixed(2)}</p>
                  <p>Tax ({selectedReceipt.tax_rate}%): {selectedReceipt.currency} {selectedReceipt.tax.toFixed(2)}</p>
                  <p className="font-bold">Total: {selectedReceipt.currency} {selectedReceipt.total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}