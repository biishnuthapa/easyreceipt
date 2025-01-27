import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY is not set. Email functionality will not work.');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

interface Item {
  name: string;
  price: number;
  quantity: number;
}

interface ReceiptEmailData {
  receiptNumber: string;
  customerName: string;
  customerEmail: string;
  companyName: string;
  items: Item[];
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  date: string;
  pdfContent?: string; // Base64 PDF content
}

interface SendGridError extends Error {
  response?: {
    body: any;
  };
}

export async function sendReceiptEmail(data: ReceiptEmailData) {
  try {
    const itemsList = data.items
      .map(
        (item) =>
          `${item.name} x ${item.quantity} - ${data.currency} ${(item.price * item.quantity).toFixed(2)}`
      )
      .join('\n');

    const htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Receipt from ${data.companyName}</h2>
  
  <p>Dear ${data.customerName},</p>
  
  <p>Thank you for your business! Please find your receipt attached to this email.</p>
  
  <div style="margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
    <p><strong>Receipt Number:</strong> ${data.receiptNumber}</p>
    <p><strong>Date:</strong> ${data.date}</p>
    
    <h3>Items:</h3>
    <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
      <tr style="background-color: #f8f9fa;">
        <th style="text-align: left; padding: 8px;">Item</th>
        <th style="text-align: right; padding: 8px;">Amount</th>
      </tr>
      ${data.items.map(item => `
        <tr>
          <td style="padding: 8px; border-top: 1px solid #ddd;">
            ${item.name} x ${item.quantity}
          </td>
          <td style="text-align: right; padding: 8px; border-top: 1px solid #ddd;">
            ${data.currency} ${(item.price * item.quantity).toFixed(2)}
          </td>
        </tr>
      `).join('')}
    </table>
    
    <div style="margin-top: 20px; border-top: 2px solid #ddd; padding-top: 10px;">
      <p style="display: flex; justify-content: space-between;">
        <span>Subtotal:</span>
        <strong>${data.currency} ${data.subtotal.toFixed(2)}</strong>
      </p>
      <p style="display: flex; justify-content: space-between;">
        <span>Tax:</span>
        <strong>${data.currency} ${data.tax.toFixed(2)}</strong>
      </p>
      <p style="display: flex; justify-content: space-between; font-size: 1.2em;">
        <span>Total:</span>
        <strong>${data.currency} ${data.total.toFixed(2)}</strong>
      </p>
    </div>
    
    <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
  </div>
  
  <p>Best regards,<br>${data.companyName}</p>
</div>`;

    const msg: any = {
      to: data.customerEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@2quickpaper.com',
        name: data.companyName
      },
      subject: `Receipt #${data.receiptNumber} from ${data.companyName}`,
      text: itemsList,
      html: htmlContent,
    };

    // Attach PDF if available
    if (data.pdfContent) {
      const pdfBuffer = Buffer.from(data.pdfContent.split(',')[1], 'base64');
      msg.attachments = [
        {
          content: pdfBuffer.toString('base64'),
          filename: `receipt-${data.receiptNumber}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment'
        }
      ];
    }

    const response = await sgMail.send(msg);
    console.log('Email sent successfully:', response);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    const sendGridError = error as SendGridError;
    if (sendGridError.response) {
      console.error('SendGrid API error:', sendGridError.response.body);
    }
    return { success: false, error: sendGridError };
  }
}