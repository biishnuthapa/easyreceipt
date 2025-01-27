import { NextResponse } from 'next/server';
import { sendReceiptEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Attempting to send email with data:', {
      to: data.customer_email,
      receiptNumber: data.receipt_number,
    });

    const result = await sendReceiptEmail({
      receiptNumber: data.receipt_number,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      companyName: data.companyName,
      items: data.items,
      currency: data.currency,
      subtotal: data.subtotal,
      tax: data.tax,
      total: data.total,
      paymentMethod: data.payment_method,
      date: data.date,
      pdfContent: data.pdfContent,
    });

    if (!result.success) {
      console.error('Failed to send email:', result.error);
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in send-receipt route:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}