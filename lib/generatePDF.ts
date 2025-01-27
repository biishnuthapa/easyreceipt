import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface GeneratePDFData {
  receiptNumber: string;
  date: string;
  customerName: string;
  customerNumber?: string;
  customerAddress?: string;
  companyName: string;
  companyLogo?: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  currency: string;
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  paymentMethod: string;
  signature?: string | null;
  title?: string | null;
}

export function generatePDF(data: GeneratePDFData): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF();
      let yPos = 20;
      const margin = 20;
      const pageWidth = doc.internal.pageSize.width;

      // Function to load image and return promise
      const loadImage = (dataUrl: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = dataUrl;
        });
      };

      // Function to add image maintaining aspect ratio
      const addImageWithAspectRatio = (img: HTMLImageElement, x: number, y: number, maxWidth: number, maxHeight: number) => {
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        doc.addImage(img, 'PNG', x, y, width, height);
        return height;
      };

      // Process everything in sequence
      const processDocument = async () => {
        // Add company logo if provided
        if (data.companyLogo) {
          try {
            const logoImg = await loadImage(data.companyLogo);
            const logoHeight = addImageWithAspectRatio(logoImg, margin, yPos, 40, 20);
            doc.text(data.companyName, margin + 45, yPos + 10);
            yPos += Math.max(logoHeight, 20) + 10;
          } catch (error) {
            console.error('Error adding logo:', error);
            doc.text(data.companyName, margin, yPos);
            yPos += 10;
          }
        } else {
          doc.text(data.companyName, margin, yPos);
          yPos += 10;
        }

        // Add receipt details
        doc.setFontSize(12);
        doc.text(`Receipt #: ${data.receiptNumber}`, margin, yPos += 15);
        doc.text(`Date: ${data.date}`, margin, yPos += 7);

        // Add customer details
        doc.text('Bill To:', margin, yPos += 13);
        doc.text(data.customerName, margin, yPos += 7);
        if (data.customerNumber) doc.text(`Contact Number: ${data.customerNumber}`, margin, yPos += 7);
        if (data.customerAddress) {
          const addressLines = doc.splitTextToSize(data.customerAddress, pageWidth - 2 * margin);
          doc.text(addressLines, margin, yPos += 7);
          yPos += (addressLines.length - 1) * 7;
        }

        // Add items table
        const tableData = data.items.map(item => [
          item.name,
          item.quantity.toString(),
          `${data.currency} ${item.price.toFixed(2)}`,
          `${data.currency} ${(item.price * item.quantity).toFixed(2)}`
        ]);

        yPos += 10;
        (doc as any).autoTable({
          startY: yPos,
          head: [['Description', 'Quantity', 'Unit Price', 'Total']],
          body: tableData,
          margin: { left: margin, right: margin },
        });

        // Get the final Y position after the table
        yPos = (doc as any).lastAutoTable.finalY + 10;

        // Add totals
        const totalsX = pageWidth - margin - 60;
        doc.text(`Subtotal: ${data.currency} ${data.subtotal.toFixed(2)}`, totalsX, yPos);
        doc.text(`Tax (${data.taxRate}%): ${data.currency} ${data.tax.toFixed(2)}`, totalsX, yPos + 7);
        doc.text(`Total: ${data.currency} ${data.total.toFixed(2)}`, totalsX, yPos + 14);

        // Add payment method
        doc.text(`Payment Method: ${data.paymentMethod}`, margin, yPos + 25);

        // Add signature if provided
        if (data.signature) {
          try {
            const signatureImg = await loadImage(data.signature);
            addImageWithAspectRatio(signatureImg, margin, yPos + 35, 40, 20);
          } catch (error) {
            console.error('Error adding signature:', error);
          }
        }

        // Add title if provided
        if (data.title) {
          doc.text(data.title, margin, yPos + 65);
        }

        resolve(doc.output('datauristring'));
      };

      processDocument().catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}