import twilio from 'twilio';
import { uploadPDF } from './storage';

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
  console.warn('Twilio credentials not set. WhatsApp functionality will not work.');
}

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

interface WhatsAppReceiptData {
  receiptNumber: string;
  customerName: string;
  customerWhatsapp: string;
  companyName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  date: string;
  pdfContent?: string;
}

interface TwilioError extends Error {
  code?: string;
  status?: number;
}

export async function sendReceiptWhatsApp(data: WhatsAppReceiptData) {
  try {
    console.log('Starting WhatsApp send process...');
    
    const itemsList = data.items
      .map(
        (item) =>
          `${item.name} x ${item.quantity} - ${data.currency} ${(
            item.price * item.quantity
          ).toFixed(2)}`
      )
      .join('\n');

    const message = `
*Receipt from ${data.companyName}*

Receipt #: ${data.receiptNumber}
Date: ${data.date}

To: ${data.customerName}

*Items:*
${itemsList}

*Summary:*
Subtotal: ${data.currency} ${data.subtotal.toFixed(2)}
Tax: ${data.currency} ${data.tax.toFixed(2)}
*Total: ${data.currency} ${data.total.toFixed(2)}*

Payment Method: ${data.paymentMethod}

Thank you for your business!
`;

    // Format the WhatsApp number
    let whatsappNumber = data.customerWhatsapp;
    if (!whatsappNumber.startsWith('+')) {
      whatsappNumber = '+' + whatsappNumber;
    }
    // Remove any spaces or special characters
    whatsappNumber = whatsappNumber.replace(/[^+\d]/g, '');

    console.log('Sending initial WhatsApp message...');
    
    // First, send the message with the receipt details
    const messageResponse = await client.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${whatsappNumber}`,
    });

    console.log('Initial message sent successfully:', messageResponse.sid);

    // If PDF content is available, upload and send it
    if (data.pdfContent) {
      try {
        console.log('Uploading PDF...');
        // Upload PDF and get public URL
        const pdfUrl = await uploadPDF(
          data.pdfContent,
          `receipt-${data.receiptNumber}.pdf`
        );

        console.log('PDF uploaded successfully, sending as attachment...');

        // Send PDF as a separate message
        const pdfMessageResponse = await client.messages.create({
          from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
          to: `whatsapp:${whatsappNumber}`,
          body: 'Here is your receipt PDF:',
          mediaUrl: [pdfUrl]
        });

        console.log('PDF message sent successfully:', pdfMessageResponse.sid);
      } catch (uploadError) {
        console.error('Error handling PDF:', uploadError);
        // Continue without sending PDF but don't fail the whole process
      }
    }

    console.log('WhatsApp message sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    const twilioError = error as TwilioError;
    if (twilioError.code) {
      console.error('Twilio error code:', twilioError.code);
    }
    return { 
      success: false, 
      error: {
        message: twilioError.message || 'Unknown error',
        code: twilioError.code,
        status: twilioError.status
      }
    };
  }
}