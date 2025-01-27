'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase/client';

interface Customer {
  name: string;
  email: string;
  whatsapp: string;
  number: string;
  total_receipts: number;
  total_amount: number;
  last_receipt_date: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: receipts } = await supabase
        .from('receipts')
        .select('customer_name, customer_email, customer_whatsapp, customer_number, total, created_at')
        .eq('profile_id', user.id);

      if (receipts) {
        const customersMap = new Map<string, Customer>();

        receipts.forEach(receipt => {
          const key = receipt.customer_name;
          const existing = customersMap.get(key);

          if (existing) {
            existing.total_receipts += 1;
            existing.total_amount += receipt.total;
            if (new Date(receipt.created_at) > new Date(existing.last_receipt_date)) {
              existing.last_receipt_date = receipt.created_at;
            }
          } else {
            customersMap.set(key, {
              name: receipt.customer_name,
              email: receipt.customer_email || '',
              whatsapp: receipt.customer_whatsapp || '',
              number: receipt.customer_number || '',
              total_receipts: 1,
              total_amount: receipt.total,
              last_receipt_date: receipt.created_at,
            });
          }
        });

        setCustomers(Array.from(customersMap.values()));
      }
    }
    
    setIsLoading(false);
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.whatsapp.includes(searchTerm) ||
    customer.number.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Customer Number</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Total Receipts</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Last Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer, index) => (
                  <TableRow key={index}>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.number || '-'}</TableCell>
                    <TableCell>{customer.email || '-'}</TableCell>
                    <TableCell>{customer.whatsapp || '-'}</TableCell>
                    <TableCell>{customer.total_receipts}</TableCell>
                    <TableCell>NRs {customer.total_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      {new Date(customer.last_receipt_date).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}