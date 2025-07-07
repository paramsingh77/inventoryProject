const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Register fonts
const FONTS = {
  Calibri: {
    normal: path.join(__dirname, '../fonts/calibri-regular.ttf'),
    bold: path.join(__dirname, '../fonts/calibri-bold.ttf'),
    italic: path.join(__dirname, '../fonts/calibri-italic.ttf'),
    boldItalic: path.join(__dirname, '../fonts/calibri-bold-italic.ttf')
  }
};

// Verify font files exist
Object.entries(FONTS.Calibri).forEach(([weight, path]) => {
  if (!fs.existsSync(path)) {
    console.error(`❌ Missing font file: ${path}`);
  }
});

async function generatePurchaseOrderPdf(po) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Purchase Order - ${po.order_number}`,
          Author: 'AAM Inventory'
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Company Logo
      const logoPath = path.join(__dirname, '../public/images/image.png');
      doc.image(logoPath, {
        fit: [100, 100],
        align: 'center',
        valign: 'center'
      });

      // Company Information - Left aligned under logo
      doc.font('Helvetica').fontSize(11);
      doc.text('AAM Inventory', 50, 135);
      doc.text('700 17th Street, Modesto, CA 95354', 50, 150);
      doc.text('IT Department', 50, 165);
      doc.text('Phone: (555) 123-4567', 50, 180);
      doc.text('Email: info@aaminventory.com', 50, 195);

      // Purchase Order Header - Right aligned
      doc.font('Helvetica-Bold').fontSize(28);
      doc.text('PURCHASE', 400, 45, { align: 'left' });
      doc.text('ORDER', 400, 75, { align: 'left' });

      // PO Details Box - Right aligned
      doc.rect(400, 105, 150, 50).stroke();
      doc.fontSize(10);
      doc.font('Helvetica-Bold');
      doc.text('PO NUMBER', 405, 110);
      doc.font('Helvetica');
      doc.text(po.order_number, 405, 125);
      doc.font('Helvetica-Bold');
      doc.text('DATE', 405, 140);
      doc.font('Helvetica');
      doc.text(new Date(po.created_at).toLocaleDateString(), 405, 155);

      // Main Content Boxes
      const boxY = 230;
      const boxHeight = 120;

      // Vendor Box
      doc.rect(50, boxY, 250, boxHeight).stroke();
      doc.font('Helvetica-Bold').fontSize(11);
      doc.text('VENDOR', 60, boxY + 10);
      
      doc.font('Helvetica').fontSize(10);
      doc.text('NAME', 60, boxY + 30);
      doc.text(po.supplier_name || 'Not Specified', 60, boxY + 45);
      doc.text('COMPANY NAME', 60, boxY + 60);
      doc.text(po.company_name || po.supplier_name || 'Not Specified', 60, boxY + 75);
      doc.text('ADDRESS', 60, boxY + 90);
      doc.text(po.supplier_address || '123 Vendor Street', 60, boxY + 105);

      // Shipping Box
      doc.rect(320, boxY, 250, boxHeight).stroke();
      doc.font('Helvetica-Bold').fontSize(11);
      doc.text('SHIPPING INFORMATION', 330, boxY + 10);
      
      doc.font('Helvetica').fontSize(10);
      doc.text('SHIPPING TERMS', 330, boxY + 30);
      doc.text('Standard Delivery', 330, boxY + 45);
      doc.text('SHIPPING METHOD', 330, boxY + 60);
      doc.text('Ground', 330, boxY + 75);
      doc.text('DELIVERY DATE', 330, boxY + 90);
      doc.text(new Date(po.delivery_date || Date.now()).toLocaleDateString(), 330, boxY + 105);

      // Items Table
      const tableTop = boxY + boxHeight + 30;
      
      // Table Headers with borders
      doc.rect(50, tableTop, 520, 25).stroke();
      doc.font('Helvetica-Bold').fontSize(10);
      
      const headers = [
        { text: 'Code', x: 60, width: 50 },
        { text: 'Product Description', x: 120, width: 250 },
        { text: 'Quantity', x: 380, width: 60 },
        { text: 'Unit Price ($)', x: 440, width: 80 },
        { text: 'Amount ($)', x: 500, width: 60 }
      ];

      headers.forEach(header => {
        doc.text(header.text, header.x, tableTop + 8, { width: header.width });
      });

      // Table Rows
      let y = tableTop + 25;
      doc.font('Helvetica');
      
      if (po.items && po.items.length > 0) {
        po.items.forEach(item => {
          doc.rect(50, y, 520, 25).stroke();
          doc.text(item.code || '-', 60, y + 8, { width: 50 });
          doc.text(item.description || 'Item', 120, y + 8, { width: 250 });
          doc.text(item.quantity.toString(), 380, y + 8, { width: 60 });
          doc.text(parseFloat(item.unit_price || 0).toFixed(2), 440, y + 8, { width: 80 });
          doc.text(parseFloat(item.total_price || 0).toFixed(2), 500, y + 8, { width: 60 });
          y += 25;
        });
      }

      // Totals Section - Right aligned with proper spacing
      const totalsX = 380;
      y += 10;

      const subtotal = po.items?.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0) || 0;
      const tax = subtotal * 0.10;
      const shipping = 50.00;
      const total = subtotal + tax + shipping;

      // Format totals section
      doc.font('Helvetica').fontSize(10);
      doc.text('Subtotal', totalsX, y);
      doc.text(`$${subtotal.toFixed(2)}`, 500, y);
      
      y += 20;
      doc.text('Tax (10%)', totalsX, y);
      doc.text(`$${tax.toFixed(2)}`, 500, y);
      
      y += 20;
      doc.text('Shipping & Handling', totalsX, y);
      doc.text(`$${shipping.toFixed(2)}`, 500, y);
      
      // Total Amount Box
      y += 20;
      doc.rect(totalsX - 10, y, 180, 25).stroke();
      doc.font('Helvetica-Bold').fontSize(11);
      doc.text('Total Amount', totalsX, y + 7);
      doc.text(`$${total.toFixed(2)}`, 500, y + 7);

      // Terms & Conditions
      y += 50;
      doc.fontSize(11);
      doc.text('TERMS & CONDITIONS', 50, y);
      
      doc.font('Helvetica').fontSize(10);
      y += 20;
      doc.text('Note:', 50, y);
      doc.text('Payment shall be Net 30 days upon receipt of the items above.', 50, y + 15);
      doc.text('Standard terms and conditions apply.', 50, y + 30);

      // Signature Section
      y += 70;
      doc.text('Prepared by', 50, y);
      doc.text('Approved by', 300, y);
      
      // Signature lines
      doc.moveTo(50, y + 40).lineTo(200, y + 40).stroke();
      doc.moveTo(300, y + 40).lineTo(450, y + 40).stroke();
      
      doc.text(po.prepared_by || 'admin', 50, y + 45);
      doc.text('____________________', 300, y + 45);

      doc.end();
    } catch (error) {
      console.error('❌ PDF Generation Error:', error);
      reject(error);
    }
  });
}

module.exports = { generatePurchaseOrderPdf }; 