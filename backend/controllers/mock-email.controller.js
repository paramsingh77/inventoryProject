/**
 * Mock Email Controller
 * 
 * This controller simulates email functionality without actually connecting
 * to an email server or requiring valid email credentials.
 */

const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // Create a test account if we're in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Creating development email transport...');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: true,
      logger: true
    });
  }
  
  // Production transport
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Function to send real email
const sendRealEmail = async (to, subject, message, attachment = null) => {
  try {
    const transporter = createTransporter();
    
    // Log the email configuration (without sensitive data)
    console.log('Email Configuration:', {
      host: transporter.options.host,
      port: transporter.options.port,
      secure: transporter.options.secure,
      user: process.env.EMAIL_USER
    });
    
    const mailOptions = {
      from: {
        name: 'AAM Inventory',
        address: process.env.EMAIL_USER
      },
      to,
      subject,
      text: message,
      attachments: attachment ? [
        {
          filename: attachment.originalname,
          path: attachment.path
        }
      ] : []
    };

    console.log('Sending email with options:', {
      to: mailOptions.to,
      subject: mailOptions.subject,
      hasAttachment: !!attachment
    });

    // Verify connection configuration
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      response: info.response
    });
    
    return true;
  } catch (error) {
    console.error('Error in sendRealEmail:', error);
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Please check your email credentials.');
    }
    throw error;
  }
};

// Mock function to simulate sending a purchase order via email
const sendPurchaseOrderEmail = async (req, res) => {
  const { poId, to, subject, message } = req.body;
  
  console.log('\n📧 ATTEMPTING TO SEND REAL EMAIL 📧');
  console.log('----------------------------------');
  console.log(`🆔 PO ID: ${poId}`);
  console.log(`📤 To: ${to}`);
  console.log(`📑 Subject: ${subject}`);
  console.log('📝 Message:');
  console.log(message);
  console.log('----------------------------------\n');
  
  try {
    const emailSent = await sendRealEmail(to, subject, message);
    
    if (emailSent) {
      res.status(200).json({
        success: true,
        message: 'Purchase order email sent successfully',
        data: {
          poId,
          to,
          subject,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      throw new Error('Failed to send email');
    }
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
};

// Mock function to simulate sending a purchase order with a PDF attachment
const sendPurchaseOrderWithPdf = async (req, res) => {
  const { poId, to, subject, message } = req.body;
  const pdfFile = req.file;
  
  console.log('\n📧 ATTEMPTING TO SEND REAL EMAIL WITH ATTACHMENT 📧');
  console.log('----------------------------------');
  console.log(`🆔 PO ID: ${poId || 'Not provided'}`);
  console.log(`📤 To: ${to}`);
  console.log(`📑 Subject: ${subject}`);
  
  if (pdfFile) {
    console.log(`📎 Attachment: ${pdfFile.originalname} (${pdfFile.size} bytes)`);
    console.log(`📂 File saved at: ${pdfFile.path}`);
  } else {
    console.log('⚠️ No PDF attachment found');
    return res.status(400).json({
      success: false,
      message: 'No PDF attachment provided'
    });
  }
  
  try {
    const emailSent = await sendRealEmail(to, subject, message, pdfFile);
    
    if (emailSent) {
      res.status(200).json({
        success: true,
        message: 'Purchase order email with PDF sent successfully',
        data: {
          poId: poId || 'unknown',
          to,
          subject,
          attachment: {
            name: pdfFile.originalname,
            size: pdfFile.size,
            type: pdfFile.mimetype
          },
          timestamp: new Date().toISOString()
        }
      });
    } else {
      throw new Error('Failed to send email with attachment');
    }
  } catch (error) {
    console.error('Error sending email with attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email with attachment',
      error: error.message
    });
  }
};

// Mock function to check for emails
const checkEmails = (req, res) => {
  console.log('\n📬 MOCK EMAIL CHECK 📬');
  console.log('----------------------------------');
  console.log('✅ Checked for new emails (mock)');
  console.log('📥 No new emails found');
  console.log('----------------------------------\n');
  
  res.status(200).json({
    success: true,
    message: 'Email check completed (mock)',
    data: {
      newEmails: 0,
      timestamp: new Date().toISOString()
    }
  });
};

// Mock function to get received invoices
const getInvoices = (req, res) => {
  const { limit = 10, offset = 0 } = req.query;
  
  // Generate some mock invoices
  const invoices = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
    id: `inv-${i + 1 + parseInt(offset)}`,
    invoiceNumber: `INV-${1000 + i + parseInt(offset)}`,
    poReference: `PO-${2000 + i + parseInt(offset)}`,
    vendorName: `Mock Vendor ${i + 1}`,
    vendorEmail: `vendor${i + 1}@example.com`,
    amount: (Math.random() * 1000 + 100).toFixed(2),
    status: ['Received', 'Approved', 'Rejected'][Math.floor(Math.random() * 3)],
    receivedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    fileName: `invoice-${1000 + i}.pdf`
  }));
  
  console.log('\n📋 MOCK INVOICES FETCHED 📋');
  console.log('----------------------------------');
  console.log(`📊 Returned ${invoices.length} mock invoices`);
  console.log(`📄 Page: ${offset/limit + 1} (limit: ${limit}, offset: ${offset})`);
  console.log('----------------------------------\n');
  
  res.status(200).json({
    success: true,
    message: 'Invoices fetched successfully (mock)',
    data: {
      invoices,
      total: 15, // Mock total
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
};

// Mock function to get a specific invoice by ID
const getInvoiceById = (req, res) => {
  const { invoiceId } = req.params;
  
  const invoice = {
    id: invoiceId,
    invoiceNumber: `INV-${invoiceId.replace(/\D/g, '')}`,
    poReference: `PO-${2000 + parseInt(invoiceId.replace(/\D/g, ''))}`,
    vendorName: 'Mock Vendor',
    vendorEmail: 'vendor@example.com',
    amount: (Math.random() * 1000 + 100).toFixed(2),
    status: 'Received',
    receivedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    fileName: `invoice-${invoiceId}.pdf`,
    items: [
      { description: 'Mock Item 1', quantity: 2, price: 45.99 },
      { description: 'Mock Item 2', quantity: 1, price: 129.99 }
    ]
  };
  
  console.log('\n📃 MOCK INVOICE DETAILS FETCHED 📃');
  console.log('----------------------------------');
  console.log(`🆔 Invoice ID: ${invoiceId}`);
  console.log(`📝 Invoice Number: ${invoice.invoiceNumber}`);
  console.log(`🔗 PO Reference: ${invoice.poReference}`);
  console.log('----------------------------------\n');
  
  res.status(200).json({
    success: true,
    message: 'Invoice fetched successfully (mock)',
    data: invoice
  });
};

// Mock function to link an invoice to a PO
const linkInvoiceToPO = (req, res) => {
  const { invoiceId } = req.params;
  const { poId } = req.body;
  
  console.log('\n🔗 MOCK INVOICE LINKED TO PO 🔗');
  console.log('----------------------------------');
  console.log(`🧾 Invoice ID: ${invoiceId}`);
  console.log(`📜 PO ID: ${poId}`);
  console.log('----------------------------------\n');
  
  res.status(200).json({
    success: true,
    message: 'Invoice linked to PO successfully (mock)',
    data: {
      invoiceId,
      poId,
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = {
  sendPurchaseOrderEmail,
  sendPurchaseOrderWithPdf,
  checkEmails,
  getInvoices,
  getInvoiceById,
  linkInvoiceToPO
}; 