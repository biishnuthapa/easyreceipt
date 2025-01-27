import { NextResponse } from 'next/server';
import { sendReceiptWhatsApp } from '@/lib/whatsapp';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    console.log('Cookies:', (await cookieStore).getAll());

    const supabase = await createClient(cookieStore);
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    console.log('Session:', session);
    console.log('Auth Error:', authError);

    if (authError) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Authentication failed', details: authError.message },
        { status: 401 }
      );
    }

    if (!session || !session.user) {
      console.error('No session found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const data = await request.json();
    console.log('Processing WhatsApp request with data:', {
      to: data.customer_whatsapp,
      receiptNumber: data.receipt_number,
      userId: session.user.id
    });

    // Save the receipt to the database
    const { error: insertError } = await supabase
      .from('receipts')
      .insert({
        profile_id: session.user.id,
        receipt_number: data.receipt_number,
        customer_name: data.customer_name,
        customer_whatsapp: data.customer_whatsapp,
        payment_method: data.payment_method,
        items: data.items,
        currency: data.currency,
        subtotal: data.subtotal,
        tax_rate: data.tax_rate,
        tax: data.tax,
        total: data.total,
        sent_via: 'whatsapp',
        signature: data.signature,
        title: data.title
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save receipt', details: insertError.message },
        { status: 500 }
      );
    }

    // Send WhatsApp message
    const result = await sendReceiptWhatsApp({
      receiptNumber: data.receipt_number,
      customerName: data.customer_name,
      customerWhatsapp: data.customer_whatsapp,
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
      console.error('Failed to send WhatsApp:', result.error);
      return NextResponse.json(
        { error: 'Failed to send WhatsApp message', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in send-whatsapp route:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}