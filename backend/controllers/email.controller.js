const nodemailer = require('nodemailer');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const PDFDocument = require('pdfkit');

// Email configuration - Use environment variables in production
const EMAIL_USER = process.env.EMAIL_USER || 'invoice.tester11@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'vmen hgvm rskq zjpx';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const SMTP_PORT = process.env.SMTP_PORT || 587;
const IMAP_HOST = process.env.IMAP_HOST || 'imap.gmail.com';
const COMPANY_NAME = process.env.COMPANY_NAME || 'AAM Inventory'; // Add company name configuration

// Create reusable transporter for sending emails
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false // Disable SSL verification for development
  }
});

// Verify SMTP connection on startup
transporter.verify()
  .then(() => console.log('✅ SMTP connection verified - Email sending is ready'))
  .catch(err => console.error('❌ SMTP connection error:', err.message));

// Create IMAP client for reading emails
const imapConfig = {
  user: EMAIL_USER,
  password: EMAIL_PASS,
  host: IMAP_HOST,
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

// Generate PDF for purchase order
const generatePOPdf = async (purchaseOrder) => {
  return new Promise((resolve, reject) => {
    try {
      // Create directory if it doesn't exist
      const dir = path.join(__dirname, '../files/generated');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const filename = `PO_${purchaseOrder.poNumber || 'temp'}_${Date.now()}.pdf`;
      const filepath = path.join(dir, filename);
      
      // Create a new PDF document
      const doc = new PDFDocument({ margin: 50 });
      doc.pipe(fs.createWriteStream(filepath));
      
      // Helper function for creating blue section headers
      const drawSectionHeader = (text, y) => {
        const headerColor = '#0066ff'; // Bright blue color for headers
        
        doc.fillColor(headerColor)
           .rect(50, y, doc.page.width - 100, 25)
           .fill();
        
        doc.fillColor('white')
           .fontSize(11)
           .font('Helvetica-Bold')
           .text(text, 60, y + 7);
           
        return y + 25; // Return the new y position
      };
      
      // Logo and header information
      try {
        // Try to load logo from project directory
        const logoPath = path.join(__dirname, '../../src/images/image copy.png');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 50, { width: 50 });
        } else {
          // Fallback: create simple colored shield logo
          doc.roundedRect(50, 50, 50, 50, 10)
             .fillAndStroke('#0066ff', '#0055aa');
          doc.fillColor('white')
             .fontSize(20)
             .text('AAM', 75, 65, { align: 'center' });
        }
      } catch (logoError) {
        console.warn('Could not load logo:', logoError);
        // Fallback logo if image fails to load
        doc.roundedRect(50, 50, 50, 50, 10)
           .fillAndStroke('#0066ff', '#0055aa');
      }
      
      // Company information
      doc.fontSize(11).font('Helvetica-Bold')
         .fillColor('black')
         .text('AAM Inventory', 50, 105)
         .fontSize(9).font('Helvetica')
         .text('700 17th Street, Modesto, CA 95354', 50, 120)
         .text('IT Department', 50, 135)
         .text('Phone: (555) 123-4567', 50, 150)
         .text('Email: info@aaminventory.com', 50, 165);
         
      // Purchase Order Title and Number
      doc.fontSize(16).font('Helvetica-Bold')
         .fillColor('#0066ff')
         .text('PURCHASE ORDER', 350, 60, { align: 'right' });
      
      doc.fontSize(9).font('Helvetica-Bold')
         .fillColor('black')
         .text('PO NUMBER', 350, 100, { align: 'left' });
         
      doc.fontSize(9)
         .text(`PO-${purchaseOrder.poNumber || '825635-199'}`, 500, 100, { align: 'right' });
      
      doc.fontSize(9).font('Helvetica-Bold')
         .text('DATE', 350, 115, { align: 'left' });
         
      // Use the format 3/4/2025
      const formattedDate = new Date().toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
      });
      
      doc.fontSize(9).font('Helvetica')
         .text(formattedDate, 500, 115, { align: 'right' });
      
      // Sections - Start at y position 190
      let yPos = 190;
      
      // VENDOR SECTION
      yPos = drawSectionHeader('VENDOR', yPos);
      
      // Vendor Info Box
      doc.rect(50, yPos, (doc.page.width - 100) / 2 - 5, 180).stroke();
      
      // Vendor details
      doc.fillColor('black').fontSize(9);
      doc.font('Helvetica-Bold').text('NAME', 60, yPos + 10);
      doc.font('Helvetica').text(purchaseOrder.vendor?.name || 'John Smith', 60, yPos + 25);
      
      doc.font('Helvetica-Bold').text('COMPANY NAME', 60, yPos + 40);
      doc.font('Helvetica').text(purchaseOrder.vendor?.company || 'Global Trading Co.', 60, yPos + 55);
      
      doc.font('Helvetica-Bold').text('ADDRESS', 60, yPos + 70);
      doc.font('Helvetica').text(purchaseOrder.vendor?.address1 || '123 Trading St', 60, yPos + 85);
      doc.font('Helvetica').text(purchaseOrder.vendor?.address2 || 'Commerce City, CA 90001', 60, yPos + 100);
      
      doc.font('Helvetica-Bold').text('PHONE', 60, yPos + 115);
      doc.font('Helvetica').text(purchaseOrder.vendor?.phone || '(555) 123-4567', 60, yPos + 130);
      
      doc.font('Helvetica-Bold').text('EMAIL', 60, yPos + 145);
      doc.font('Helvetica').text(purchaseOrder.vendor?.email || 'john@globaltrading.com', 60, yPos + 160);
      
      // SHIPPING SECTION
      drawSectionHeader('SHIPPING INFORMATION', yPos);
      
      const shippingBoxX = (doc.page.width - 100) / 2 + 55;
      doc.rect(shippingBoxX, yPos, (doc.page.width - 100) / 2 - 5, 180).stroke();
      
      const shipX = shippingBoxX + 10;
      
      doc.fillColor('black').fontSize(9);
      doc.font('Helvetica-Bold').text('SHIPPING TERMS', shipX, yPos + 10);
      doc.font('Helvetica').text('FOB Destination', shipX, yPos + 25);
      
      doc.font('Helvetica-Bold').text('SHIPPING METHOD', shipX + 150, yPos + 10);
      doc.font('Helvetica').text('Ground', shipX + 150, yPos + 25);
      
      doc.font('Helvetica-Bold').text('DELIVERY DATE', shipX, yPos + 55);
      doc.font('Helvetica').text(formattedDate, shipX, yPos + 70);
      
      // Move position below the boxes
      yPos += 195;
      
      // Line Items Table
      const tableHeaders = {
        code: 'Code',
        description: 'Product Description',
        quantity: 'Quantity',
        price: 'Unit Price ($)',
        amount: 'Amount ($)'
      };
      
      const columnWidths = {
        code: 60,
        description: 220,
        quantity: 60,
        price: 80,
        amount: 80
      };
      
      // Draw the table header cells and borders
      let currentX = 50;
      doc.lineWidth(0.5);
      
      // Function to draw table cell
      const drawTableCell = (text, x, y, width, align = 'left', isHeader = false) => {
        doc.rect(x, y, width, 20).stroke();
        doc.fontSize(9);
        if (isHeader) {
          doc.font('Helvetica-Bold');
        } else {
          doc.font('Helvetica');
        }
        
        const textX = align === 'center' ? x + width / 2 : 
                      align === 'right' ? x + width - 5 : x + 5;
        
        doc.text(text, textX, y + 6, { 
          width: width - 10, 
          align 
        });
      };
      
      // Draw headers
      Object.entries(tableHeaders).forEach(([key, text]) => {
        const width = columnWidths[key];
        drawTableCell(text, currentX, yPos, width, key === 'amount' ? 'right' : key === 'quantity' ? 'center' : 'left', true);
        currentX += width;
      });
      
      // Line items
      yPos += 20;
      let subtotal = 0;
      
      // Sample item (or real items if available)
      const items = purchaseOrder.items && purchaseOrder.items.length > 0 ? 
        purchaseOrder.items : 
        [{ 
          code: 'OT-001', 
          description: 'Office Supplies\nPremium quality office supplies', 
          quantity: 10, 
          price: 43.50 
        }];
      
      items.forEach(item => {
        currentX = 50;
        const amount = (item.price || 0) * (item.quantity || 0);
        subtotal += amount;
        
        // Split description into main line and details if it contains newlines
        let [mainDesc, ...detailLines] = (item.description || '').split('\n');
        
        // Main row
        drawTableCell(item.code || '', currentX, yPos, columnWidths.code);
        currentX += columnWidths.code;
        
        drawTableCell(mainDesc || 'Product', currentX, yPos, columnWidths.description);
        currentX += columnWidths.description;
        
        drawTableCell(item.quantity?.toString() || '1', currentX, yPos, columnWidths.quantity, 'center');
        currentX += columnWidths.quantity;
        
        drawTableCell(item.price?.toFixed(2) || '0.00', currentX, yPos, columnWidths.price, 'center');
        currentX += columnWidths.price;
        
        drawTableCell(amount.toFixed(2), currentX, yPos, columnWidths.amount, 'right');
        
        yPos += 20;
        
        // Add detail lines if present
        if (detailLines.length > 0) {
          currentX = 50 + columnWidths.code; // Start at description column
          
          // Create a cell that spans from description to amount
          const spanWidth = columnWidths.description + columnWidths.quantity + columnWidths.price + columnWidths.amount;
          
          doc.rect(currentX, yPos, spanWidth, 15).stroke();
          doc.fontSize(8).font('Helvetica-Italic');
          doc.text(detailLines.join('\n'), currentX + 5, yPos + 3, { width: spanWidth - 10 });
          
          yPos += 15;
        }
      });
      
      // Calculate totals
      const tax = subtotal * 0.1; // 10% tax
      const shipping = 50; // Shipping cost
      const total = subtotal + tax + shipping;
      
      // Totals section - right aligned
      yPos += 5;
      
      // Draw totals rows (right-aligned table)
      const totalsTable = [
        { label: 'Subtotal', value: subtotal.toFixed(2) },
        { label: 'Tax (10%)', value: tax.toFixed(2) },
        { label: 'Shipping & Handling', value: shipping.toFixed(2) },
        { label: 'Total Amount', value: total.toFixed(2) }
      ];
      
      // Calculate widths
      const totalsLabelWidth = 150;
      const totalsValueWidth = 80;
      const totalsTableX = doc.page.width - 50 - totalsValueWidth;
      
      totalsTable.forEach((row, index) => {
        // Draw separator line before the final total
        if (index === totalsTable.length - 1) {
          doc.moveTo(totalsTableX, yPos).lineTo(totalsTableX + totalsValueWidth, yPos).stroke();
          yPos += 5;
        }
        
        doc.fontSize(9);
        if (index === totalsTable.length - 1) {
          doc.font('Helvetica-Bold'); // Bold for the total
        } else {
          doc.font('Helvetica');
        }
        
        doc.text(row.label, totalsTableX - totalsLabelWidth, yPos, { width: totalsLabelWidth, align: 'right' });
        doc.text('$' + row.value, totalsTableX, yPos, { width: totalsValueWidth, align: 'right' });
        
        yPos += 20;
      });
      
      // Terms and conditions
      yPos += 20;
      yPos = drawSectionHeader('TERMS & CONDITIONS', yPos);
      
      doc.rect(50, yPos, doc.page.width - 100, 80).stroke();
      
      doc.fontSize(9).font('Helvetica-Bold')
         .text('Note:', 60, yPos + 10);
      
      doc.fontSize(9).font('Helvetica')
         .text('Payment shall be net30 days upon receipt of the items above.', 60, yPos + 25)
         .text('Standard terms apply.', 60, yPos + 40);
      
      yPos += 100;
      
      // Signatures
      doc.fontSize(9).font('Helvetica-Bold')
         .text('Prepared by', 50, yPos);
      
      doc.fontSize(9).font('Helvetica')
         .text('IT Manager', 50, yPos + 15);
      
      doc.fontSize(9).font('Helvetica-Bold')
         .text('Approved by', 350, yPos);
      
      doc.moveTo(350, yPos + 30).lineTo(500, yPos + 30).stroke();
      
      // Finalize the PDF
      doc.end();
      
      // Return filepath for email attachment
      resolve({ filepath, filename });
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
};

// Controller methods
exports.sendPurchaseOrderEmail = async (req, res) => {
  try {
    console.log('\n=== SEND PURCHASE ORDER EMAIL REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { poId, to, subject, message } = req.body;
    
    // Validate required fields
    if (!poId) {
      console.error('Missing poId in request');
      return res.status(400).json({ success: false, message: 'Missing Purchase Order ID' });
    }
    
    if (!to) {
      console.error('Missing recipient (to) in request');
      return res.status(400).json({ success: false, message: 'Missing recipient email address' });
    }
    
    if (!subject) {
      console.error('Missing subject in request');
      return res.status(400).json({ success: false, message: 'Missing email subject' });
    }
    
    if (!message) {
      console.error('Missing message in request');
      return res.status(400).json({ success: false, message: 'Missing email message' });
    }
    
    console.log('\n📧 EMAIL SEND REQUEST 📧');
    console.log('----------------------------------');
    console.log(`🆔 PO ID: ${poId}`);
    console.log(`📤 To: ${to}`);
    console.log(`📑 Subject: ${subject}`);
    console.log('----------------------------------\n');
    
    // Get PO data from database (mocked for now)
    const purchaseOrder = {
      id: poId,
      poNumber: poId || '12345',
      vendor: {
        name: 'Vendor Name',
        email: to,
        address: '123 Vendor Street, Vendor City'
      },
      subtotal: 100,
      tax: 10,
      total: 110,
      items: [
        { description: 'Product 1', quantity: 1, price: 50 },
        { description: 'Product 2', quantity: 2, price: 25 }
      ]
    };
    
    console.log('Generating PDF...');
    // Generate PDF
    const { filepath, filename } = await generatePOPdf(purchaseOrder);
    console.log(`PDF generated: ${filename}`);
    
    console.log('Sending email with attachment...');
    // Send email with PDF attachment
    try {
      const info = await transporter.sendMail({
        from: `"${COMPANY_NAME}" <${EMAIL_USER}>`,
        to,
        subject,
        text: message,
        html: message.replace(/\n/g, '<br>'),
        attachments: [
          {
            filename,
            path: filepath
          }
        ]
      });
      
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', info.messageId);
      
      // Update PO status in database (mocked)
      // await updatePurchaseOrderStatus(poId, 'sent');
      
      res.status(200).json({
        success: true,
        message: 'Purchase order email sent successfully',
        data: {
          messageId: info.messageId,
          poId
        }
      });
    } catch (emailError) {
      console.error('❌ Error sending email:', emailError);
      throw emailError; // Re-throw to be caught by the outer catch block
    }
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Provide more specific error messages based on the error type
    let errorMessage = 'Failed to send purchase order email';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check email credentials.';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection to email server refused. Please check server configuration.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Connection to email server timed out. Please try again later.';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

// New endpoint to handle sending PO with attached PDF file from client
exports.sendPurchaseOrderWithPdf = async (req, res) => {
  try {
    console.log('Received request to send PO with file');
    
    // Check if a file was uploaded
    if (!req.file) {
      console.error('No PDF file provided in request');
      return res.status(400).json({ success: false, message: 'No PDF file provided' });
    }
    
    console.log('File received:', req.file.originalname, req.file.mimetype, req.file.size + 'bytes');
    
    const { poId, to, subject, message } = req.body;
    
    // Validate required fields
    if (!poId) {
      console.error('Missing poId in request');
      return res.status(400).json({ success: false, message: 'Missing Purchase Order ID' });
    }
    
    if (!to) {
      console.error('Missing recipient (to) in request');
      return res.status(400).json({ success: false, message: 'Missing recipient email address' });
    }
    
    if (!subject) {
      console.error('Missing subject in request');
      return res.status(400).json({ success: false, message: 'Missing email subject' });
    }
    
    if (!message) {
      console.error('Missing message in request');
      return res.status(400).json({ success: false, message: 'Missing email message' });
    }
    
    console.log(`Preparing to send email to ${to} with subject "${subject}"`);
    
    // Send email with the uploaded PDF attachment
    const info = await transporter.sendMail({
      from: `"${COMPANY_NAME}" <${EMAIL_USER}>`,
      to,
      subject,
      text: message,
      html: message.replace(/\n/g, '<br>'),
      attachments: [
        {
          filename: `PO-${poId}.pdf`,
          path: req.file.path // Path to temporary uploaded file
        }
      ]
    });
    
    console.log('Message sent with client-generated PDF:', info.messageId);
    
    // Delete the temporary file after sending (optional)
    try {
      fs.unlinkSync(req.file.path);
      console.log('Temporary file deleted:', req.file.path);
    } catch (unlinkError) {
      console.warn('Could not delete temporary file:', unlinkError);
    }
    
    // Return success response
    res.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Purchase order email sent successfully' 
    });
  } catch (error) {
    console.error('Error sending PO with PDF:', error);
    
    // Provide more specific error messages based on the error type
    let errorMessage = 'Failed to send purchase order email';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check email credentials.';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection to email server refused. Please check server configuration.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Connection to email server timed out. Please try again later.';
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: error.message
    });
  }
};

// Check for new emails and process invoices
exports.checkEmails = async (req, res) => {
  try {
    const imap = new Imap(imapConfig);
    
    const processEmails = () => {
      return new Promise((resolve, reject) => {
        imap.once('ready', () => {
          imap.openBox('INBOX', false, (err, box) => {
            if (err) {
              reject(err);
              return;
            }
            
            // First search for unread emails
            imap.search(['UNSEEN'], (err, results) => {
              if (err) {
                reject(err);
                return;
              }
              
              if (!results || !results.length) {
                console.log('No unread emails, searching for recent emails in the last 7 days');
                
                // If no unread emails, search for all emails from the last 7 days
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                
                // Format the date as required by IMAP library: DD-MMM-YYYY
                // Month needs to be the three-letter representation in English
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const formattedDate = `${sevenDaysAgo.getDate()}-${months[sevenDaysAgo.getMonth()]}-${sevenDaysAgo.getFullYear()}`;
                
                console.log(`Searching for ALL emails since: ${formattedDate}`);
                imap.search(['ALL', ['SINCE', formattedDate]], (err, recentResults) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                  
                  if (!recentResults || !recentResults.length) {
                    console.log('No recent emails found');
                    resolve({ success: true, message: 'No new emails found', count: 0 });
                    return;
                  }
                  
                  processEmailResults(recentResults, resolve, reject);
                });
              } else {
                console.log(`Found ${results.length} unread emails`);
                processEmailResults(results, resolve, reject);
              }
            });
          });
        });
        
        // Function to process email search results
        const processEmailResults = (results, resolve, reject) => {
          const fetch = imap.fetch(results, { bodies: '', markSeen: true });
          const processedEmails = [];
          
          fetch.on('message', (msg) => {
            msg.on('body', async (stream) => {
              try {
                const parsed = await simpleParser(stream);
                const from = parsed.from.text;
                const subject = parsed.subject;
                const date = parsed.date;
                
                console.log(`Processing email from ${from}, subject: ${subject}`);
                
                // Extract PO reference from subject
                const poRefMatch = subject.match(/PO[-\s]?#?(\d+)/i);
                const poReference = poRefMatch ? poRefMatch[1] : null;
                
                // Extract invoice number from subject
                const invMatch = subject.match(/INV[-\s]?#?([A-Za-z0-9-]+)/i);
                const invoiceNumber = invMatch ? invMatch[1] : `INV-${Date.now()}`;
                
                // Save attachments if they exist
                if (parsed.attachments && parsed.attachments.length > 0) {
                  const invoiceDir = path.join(__dirname, '../files/invoices');
                  if (!fs.existsSync(invoiceDir)) {
                    await mkdirAsync(invoiceDir, { recursive: true });
                  }
                  
                  for (const attachment of parsed.attachments) {
                    if (attachment.contentType === 'application/pdf' || 
                        attachment.filename.toLowerCase().endsWith('.pdf')) {
                      const timestamp = Date.now();
                      const filename = `Invoice_${poReference || 'Unknown'}_${timestamp}.pdf`;
                      const filepath = path.join(invoiceDir, filename);
                      
                      await writeFileAsync(filepath, attachment.content);
                      console.log(`Saved attachment: ${filename}`);
                      
                      // Extract vendor name from email
                      const vendorMatch = from.match(/([^<]+)/);
                      const vendorName = vendorMatch ? vendorMatch[1].trim() : 'Unknown Vendor';
                      
                      // Create invoice record
                      const invoice = {
                        id: `INV${timestamp}`,
                        invoiceNumber,
                        vendorName,
                        senderEmail: from,
                        subject,
                        receivedDate: date,
                        poReference,
                        status: poReference ? 'Received' : 'Pending',
                        amount: 0, // This would be extracted from the PDF in a real implementation
                        filename,
                        filepath
                      };
                      
                      processedEmails.push(invoice);
                      
                      // If we have a PO reference, dispatch an event to update the PO status
                      if (poReference) {
                        // In a real implementation, this would update a database
                        console.log(`Invoice linked to PO: ${poReference}`);
                      }
                    }
                  }
                }
              } catch (err) {
                console.error('Error processing message:', err);
              }
            });
          });
          
          fetch.once('error', (err) => {
            reject(err);
          });
          
          fetch.once('end', () => {
            console.log('Done fetching emails');
            imap.end();
            resolve({ 
              success: true, 
              message: `Processed ${processedEmails.length} emails`, 
              count: processedEmails.length,
              invoices: processedEmails
            });
          });
        };
        
        imap.once('error', (err) => {
          reject(err);
        });
        
        imap.connect();
      });
    };
    
    const result = await processEmails();
    
    // For each processed invoice, emit an event to the frontend
    if (result.invoices && result.invoices.length > 0) {
      result.invoices.forEach(invoice => {
        // In a real implementation, this would be done through a WebSocket
        console.log(`Emitting invoice event for PO: ${invoice.poReference}`);
      });
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error checking emails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check emails',
      error: error.message
    });
  }
};

// Get all invoices
exports.getInvoices = async (req, res) => {
  try {
    // In a real implementation, this would fetch from a database
    // Mock data for demonstration
    const invoices = [
      {
        id: 'INV123456',
        invoiceNumber: 'INV-2023-0001',
        vendorName: 'ABC Supplies',
        senderEmail: 'billing@abcsupplies.com',
        receivedDate: new Date('2023-03-15T10:30:00Z'),
        poReference: 'PO-001',
        status: 'Received',
        amount: 1250.75,
        filename: 'Invoice_12345_123456789.pdf'
      },
      {
        id: 'INV123457',
        invoiceNumber: 'INV-2023-0002',
        vendorName: 'XYZ Distributors',
        senderEmail: 'accounts@xyzdist.com',
        receivedDate: new Date('2023-03-16T14:15:00Z'),
        poReference: 'PO-002',
        status: 'Approved',
        amount: 890.50,
        filename: 'Invoice_Unknown_123456790.pdf'
      },
      {
        id: 'INV123458',
        invoiceNumber: 'INV-2023-0003',
        vendorName: 'Office Solutions',
        senderEmail: 'billing@officesolutions.com',
        receivedDate: new Date('2023-03-17T09:45:00Z'),
        poReference: 'PO-003',
        status: 'Rejected',
        amount: 1500.25,
        filename: 'Invoice_Unknown_123456791.pdf'
      }
    ];
    
    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    console.error('Error retrieving invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoices',
      error: error.message
    });
  }
};

// Get a specific invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    // Mock data for demonstration
    const invoice = {
      id: invoiceId,
      invoiceNumber: 'INV-2023-0001',
      vendorName: 'ABC Supplies',
      senderEmail: 'billing@abcsupplies.com',
      receivedDate: new Date('2023-03-15T10:30:00Z'),
      invoiceDate: new Date('2023-03-12'),
      dueDate: new Date('2023-04-12'),
      poReference: '12345',
      status: 'linked',
      amount: 1250.75,
      subtotal: 1150.25,
      tax: 100.50,
      shipping: 0,
      filename: 'Invoice_12345_123456789.pdf',
      extractionConfidence: 85
    };
    
    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error(`Error retrieving invoice ${req.params.invoiceId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoice',
      error: error.message
    });
  }
};

// Link an invoice to a purchase order
exports.linkInvoiceToPO = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { poId, status } = req.body;
    
    if (!poId) {
      return res.status(400).json({
        success: false,
        message: 'PO ID is required'
      });
    }
    
    // In a real implementation, this would update a database
    console.log(`Linking invoice ${invoiceId} to PO ${poId} with status ${status || 'Received'}`);
    
    // Create response data
    const updatedInvoice = {
      id: invoiceId,
      poReference: poId,
      status: status || 'Received'
    };
    
    res.status(200).json({
      success: true,
      message: `Invoice ${invoiceId} successfully linked to PO ${poId}`,
      data: updatedInvoice
    });
  } catch (error) {
    console.error(`Error linking invoice ${req.params.invoiceId} to PO:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to link invoice to PO',
      error: error.message
    });
  }
}; 