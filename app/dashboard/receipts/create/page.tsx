'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { generatePDF } from '@/lib/generatePDF';
import { Plus, Trash2, Upload, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface Item {
  name: string;
  price: number;
  quantity: number;
}

export default function CreateReceiptPage() {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([{ name: '', price: 0, quantity: 1 }]);
  const [sendVia, setSendVia] = useState<'email' | 'whatsapp'>('email');
  const [taxRate, setTaxRate] = useState<number>(1);
  const [currency, setCurrency] = useState<string>('NRs');
  const [receiptNumber, setReceiptNumber] = useState(`REC-${Math.floor(100000 + Math.random() * 900000)}`);
  const [signature, setSignature] = useState<string | null>(null);

  const addItem = () => {
    setItems([...items, { name: '', price: 0, quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof Item, value: string | number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'name' ? value : Number(value) || 0,
    };
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTax = (subtotal: number) => {
    return subtotal * (taxRate / 100);
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSignature(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getReceiptData = () => {
    if (!formRef.current) return null;

    const formData = new FormData(formRef.current);
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    const total = subtotal + tax;

    return {
      receiptNumber,
      date: format(new Date(), 'PPP'),
      customerName: formData.get('customerName') as string,
      customerNumber: formData.get('customerNumber') as string,
      customerAddress: formData.get('customerAddress') as string,
      companyName: 'Your Company',
      items,
      currency,
      subtotal,
      taxRate,
      tax,
      total,
      paymentMethod: formData.get('paymentMethod') as string,
      signature,
      title: formData.get('title') as string,
    };
  };

  const handlePreview = async () => {
    const data = getReceiptData();
    if (!data) return;

    try {
      const pdfDataUrl = await generatePDF(data);
      // Open in a new window
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(`
          <iframe 
            src="${pdfDataUrl}" 
            width="100%" 
            height="100%" 
            style="border: none;">
          </iframe>
        `);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate preview',
      });
    }
  };

  const handleDownload = async () => {
    const data = getReceiptData();
    if (!data) return;

    try {
      const pdfDataUrl = await generatePDF(data);
      const link = document.createElement('a');
      link.href = pdfDataUrl;
      link.download = `receipt-${receiptNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to download receipt',
      });
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const subtotal = calculateSubtotal();
      const tax = calculateTax(subtotal);
      const total = subtotal + tax;

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('You must be logged in to create receipts.');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_name')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Company profile not found.');

      if (items.some(item => !item.name || item.price <= 0 || item.quantity <= 0)) {
        throw new Error('All items must have a name, price greater than 0, and quantity greater than 0');
      }

      // Generate PDF first
      const pdfData = getReceiptData();
      if (!pdfData) throw new Error('Failed to generate receipt data');
      const pdfContent = await generatePDF(pdfData);

      const receipt = {
        profile_id: user.id,
        receipt_number: receiptNumber,
        customer_name: formData.get('customerName') as string,
        customer_number: formData.get('customerNumber') as string,
        customer_email: sendVia === 'email' ? formData.get('customerEmail') as string : null,
        customer_whatsapp: sendVia === 'whatsapp' ? formData.get('customerWhatsapp') as string : null,
        customer_address: formData.get('customerAddress') as string,
        payment_method: formData.get('paymentMethod') as string,
        items: items.map(item => ({
          ...item,
          price: Number(item.price),
          quantity: Number(item.quantity)
        })),
        currency,
        subtotal: Number(subtotal.toFixed(2)),
        tax_rate: taxRate,
        tax: Number(tax.toFixed(2)),
        total: Number(total.toFixed(2)),
        sent_via: sendVia,
        title: formData.get('title') as string,
        signature,
      };

      const { data: newReceipt, error: insertError } = await supabase
        .from('receipts')
        .insert(receipt)
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(insertError.message);
      }

      // Send receipt via selected method
      if (sendVia === 'email') {
        const response = await fetch('/api/send-receipt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...receipt,
            companyName: profile.company_name || 'Our Company',
            date: format(new Date(), 'PPP'),
            pdfContent,
          }),
        });

        if (!response.ok) {
          toast({
            variant: 'destructive',
            title: 'Warning',
            description: 'Receipt created but email delivery failed.',
          });
        }
      } else if (sendVia === 'whatsapp') {
        const response = await fetch('/api/send-whatsapp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...receipt,
            companyName: profile.company_name || 'Our Company',
            date: format(new Date(), 'PPP'),
            pdfContent,
          }),
        });

        if (!response.ok) {
          toast({
            variant: 'destructive',
            title: 'Warning',
            description: 'Receipt created but WhatsApp delivery failed.',
          });
        }
      }

      toast({
        title: 'Success',
        description: 'Receipt created and sent successfully.',
      });
      router.push('/dashboard/receipts');
      router.refresh();

    } catch (error) {
      console.error('Error creating receipt:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create receipt.',
      });
    }

    setIsLoading(false);
  }

  const subtotal = calculateSubtotal();
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Receipt</CardTitle>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Receipt Number</Label>
                  <Input value={receiptNumber} disabled />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    name="date"
                    defaultValue={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="customerName">Bill To</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  required
                  placeholder="Customer name"
                />
              </div>

              <div>
                <Label htmlFor="customerNumber">Customer Number</Label>
                <Input
                  id="customerNumber"
                  name="customerNumber"
                  placeholder="Customer number"
                />
              </div>

              <div>
                <Label htmlFor="customerAddress">Customer Address</Label>
                <Input
                  id="customerAddress"
                  name="customerAddress"
                  placeholder="Customer address"
                />
              </div>

              <div>
                <Label>Send Receipt Via</Label>
                <Select
                  value={sendVia}
                  onValueChange={(value: 'email' | 'whatsapp') => setSendVia(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {sendVia === 'email' && (
                <div>
                  <Label htmlFor="customerEmail">Customer Email</Label>
                  <Input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    required
                    placeholder="customer@example.com"
                  />
                </div>
              )}

              {sendVia === 'whatsapp' && (
                <div>
                  <Label htmlFor="customerWhatsapp">Customer WhatsApp</Label>
                  <Input
                    id="customerWhatsapp"
                    name="customerWhatsapp"
                    required
                    placeholder="+1234567890"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select name="paymentMethod" defaultValue="cash">
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NRs">NRs</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                <div className="grid grid-cols-12 gap-4 mb-2">
                  <div className="col-span-5">
                    <Label>Description</Label>
                  </div>
                  <div className="col-span-2">
                    <Label>Quantity</Label>
                  </div>
                  <div className="col-span-2">
                    <Label>Unit Price</Label>
                  </div>
                  <div className="col-span-2">
                    <Label>Total</Label>
                  </div>
                </div>

                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-5">
                      <Input
                        placeholder="Item description"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        required
                        min="1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateItem(index, 'price', e.target.value)}
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        value={`${currency} ${(item.price * item.quantity).toFixed(2)}`}
                        disabled
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div className="space-y-2 text-right">
                  <div>Subtotal: {currency} {subtotal.toFixed(2)}</div>
                  <div>Tax ({taxRate}%): {currency} {tax.toFixed(2)}</div>
                  <div className="text-lg font-bold">
                    Total: {currency} {total.toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="signature">Seal or Signature</Label>
                <div className="mt-2 flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('signature-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                  <input
                    id="signature-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSignatureUpload}
                  />
                  {signature && (
                    <div className="h-20 w-40 border rounded-lg overflow-hidden">
                      <img
                        src={signature}
                        alt="Signature"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Receipt title"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handlePreview}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Receipt'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}