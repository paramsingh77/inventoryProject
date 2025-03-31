const imaps = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;
const fs = require('fs');
const path = require('path');
const { pool } = require('../database/schema');
const { PDFDocument } = require('pdf-lib');
const invoiceProcessor = require('./invoiceProcessor');

// Configuration for email account
const config = {
  imap: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    tls: true,
    authTimeout: 10000,
    tlsOptions: { rejectUnauthorized: false }
  }
};

// Keywords that might indicate an invoice
const invoiceKeywords = ['invoice', 'payment', 'bill', 'receipt', 'statement', 'due'];

// Function to check if an email likely contains an invoice
const isLikelyInvoiceEmail = (subject, text) => {
  subject = subject.toLowerCase();
  text = text.toLowerCase();
  
  return invoiceKeywords.some(keyword => 
    subject.includes(keyword) || text.includes(keyword)
  );
};

// Function to save a PDF attachment
const savePdfAttachment = async (attachment, emailDate) => {
  const uploadsDir = path.join(__dirname, '../uploads/invoices');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const filename = `invoice-${Date.now()}-${attachment.filename}`;
  const filePath = path.join(uploadsDir, filename);
  
  // Save the attachment to file
  fs.writeFileSync(filePath, attachment.content);
  
  // Store in database
  const query = `
    INSERT INTO invoices (
      filename, 
      file_path, 
      status, 
      extraction_date,
      email_date
    ) VALUES ($1, $2, $3, NOW(), $4)
    RETURNING *
  `;
  
  const values = [
    attachment.filename,
    filePath,
    'new',  // Start with 'new' status
    emailDate
  ];
  
  const result = await pool.query(query, values);
  const invoice = result.rows[0];
  
  // Process the new invoice automatically
  await invoiceProcessor.processNewInvoice(invoice);
  
  return invoice.id;
};

// Main function to scan emails
const scanEmailsForInvoices = async () => {
  console.log('Starting email scan for invoices...');
  let connection;
  
  try {
    // Connect to email server
    connection = await imaps.connect(config);
    await connection.openBox('INBOX');
    
    // Search for unread emails with PDF attachments
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT'],
      markSeen: true,
      struct: true
    };
    
    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`Found ${messages.length} new messages`);
    
    const processedInvoices = [];
    
    for (const message of messages) {
      const headerPart = message.parts.find(part => part.which === 'HEADER');
      const header = headerPart.body;
      const subject = header.subject[0] || '';
      const from = header.from[0] || '';
      
      const bodyPart = message.parts.find(part => part.which === 'TEXT');
      const body = bodyPart.body;
      
      // Check if this email is likely to contain invoices
      if (!isLikelyInvoiceEmail(subject, body)) {
        console.log(`Skipping email "${subject}" - not likely an invoice`);
        continue;
      }
      
      // Get attachments
      const attachments = await imaps.getParts(connection, message.attributes.struct)
        .filter(part => part.disposition && part.disposition.type.toLowerCase() === 'attachment');
      
      // Process each attachment
      for (const attachment of attachments) {
        const partData = await connection.getPartData(message, attachment);
        
        // Check if it's a PDF
        if (attachment.disposition.params.filename.toLowerCase().endsWith('.pdf')) {
          console.log(`Processing PDF attachment: ${attachment.disposition.params.filename}`);
          
          // Extract attachment
          const attachmentData = {
            filename: attachment.disposition.params.filename,
            content: partData
          };
          
          // Get email date
          const emailDate = message.attributes.date;
          
          // Save the attachment and record in database
          const invoiceId = await savePdfAttachment(attachmentData, emailDate);
          
          processedInvoices.push({
            id: invoiceId,
            filename: attachment.disposition.params.filename,
            from,
            subject,
            date: emailDate
          });
        }
      }
    }
    
    console.log(`Processed ${processedInvoices.length} invoice PDFs`);
    return processedInvoices;
    
  } catch (error) {
    console.error('Error scanning emails for invoices:', error);
    throw error;
  } finally {
    // Close the connection
    if (connection) {
      connection.end();
    }
  }
};

// Schedule email scanning (runs every hour)
const startEmailScanner = () => {
  console.log('Starting invoice email scanner service');
  
  // Run immediately on startup
  scanEmailsForInvoices().catch(err => {
    console.error('Initial email scan failed:', err);
  });
  
  // Then schedule to run every hour
  const scanInterval = setInterval(() => {
    scanEmailsForInvoices().catch(err => {
      console.error('Scheduled email scan failed:', err);
    });
  }, 60 * 60 * 1000); // 1 hour interval
  
  return {
    stop: () => {
      console.log('Stopping invoice email scanner service');
      clearInterval(scanInterval);
    }
  };
};

module.exports = {
  startEmailScanner,
  scanEmailsForInvoices
}; 