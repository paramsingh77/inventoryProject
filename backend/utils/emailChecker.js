const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const { io } = require('../server'); // Import Socket.IO from server

// Email configuration - Use environment variables in production
const EMAIL_USER = process.env.EMAIL_USER || 'invoice.tester11@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'vmen hgvm rskq zjpx';
const IMAP_HOST = process.env.IMAP_HOST || 'imap.gmail.com';
const CHECK_INTERVAL = process.env.EMAIL_CHECK_INTERVAL || 60000; // 1 minute by default

// IMAP client configuration
const imapConfig = {
  user: EMAIL_USER,
  password: EMAIL_PASS,
  host: IMAP_HOST,
  port: 993,
  tls: true,
  tlsOptions: { 
    rejectUnauthorized: false,
    // Add timeout options to prevent hanging connections
    timeout: 10000, // 10 seconds timeout
    // Use explicit IP address for Gmail's IMAP server to avoid DNS issues
    // This is a fallback in case DNS resolution fails
    servername: IMAP_HOST
  },
  // Add connection timeout
  connTimeout: 30000, // 30 seconds connection timeout
  // Add authentication timeout
  authTimeout: 15000, // 15 seconds auth timeout
  // Add debug option for troubleshooting
  debug: process.env.NODE_ENV !== 'production' ? console.log : null
};

/**
 * Process emails with an active IMAP connection
 * @param {Imap} imap - Active IMAP connection
 */
const processEmailsWithImap = (imap) => {
  return new Promise((resolve, reject) => {
    imap.openBox('INBOX', false, (err, box) => {
      if (err) {
        console.error('Error opening inbox:', err);
        reject(err);
        return;
      }
      
      // Search for unread emails
      imap.search(['UNSEEN'], (err, results) => {
        if (err) {
          console.error('Error searching emails:', err);
          reject(err);
          return;
        }
        
        if (!results || !results.length) {
          console.log('No unread emails found');
          
          // For testing: If no unread emails, search for ALL emails from the last 7 days
          console.log('Searching for ALL emails from the last 7 days...');
          
          // Format the date as required by IMAP library: DD-MMM-YYYY
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7); // Last 7 days instead of just 1
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const formattedDate = `${sevenDaysAgo.getDate()}-${months[sevenDaysAgo.getMonth()]}-${sevenDaysAgo.getFullYear()}`;
          
          console.log(`Searching for emails since: ${formattedDate}`);
          imap.search(['ALL', ['SINCE', formattedDate]], (err, recentResults) => {
            if (err) {
              console.error('Error searching recent emails:', err);
              reject(err);
              return;
            }
            
            if (!recentResults || !recentResults.length) {
              console.log('No recent emails found either');
              resolve({ processed: 0 });
              return;
            }
            
            console.log(`Found ${recentResults.length} recent emails`);
            processEmailResults(imap, recentResults, resolve, reject);
          });
          return;
        }
        
        console.log(`Found ${results.length} unread emails`);
        processEmailResults(imap, results, resolve, reject);
      });
    });
  });
};

/**
 * Process emails and extract invoices
 * @param {Imap} imap - IMAP connection
 * @param {Array} results - Email IDs to process
 * @returns {Promise<Object>} - Result of email processing
 */
const processEmails = (imap, results) => {
  return new Promise((resolve, reject) => {
    if (!imap) {
      const imap = new Imap(imapConfig);
      
      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            console.error('Error opening inbox:', err);
            reject(err);
            return;
          }
          
          // Search for unread emails
          imap.search(['UNSEEN'], (err, results) => {
            if (err) {
              console.error('Error searching emails:', err);
              reject(err);
              return;
            }
            
            if (!results || !results.length) {
              console.log('No unread emails found');
              resolve({ message: 'No new emails found', count: 0 });
              return;
            }
            
            processEmailResults(imap, results, resolve, reject);
          });
        });
      });
      
      imap.once('error', (err) => {
        console.error('IMAP error:', err);
        reject(err);
      });
      
      imap.once('end', () => {
        console.log('IMAP connection ended');
      });
      
      imap.connect();
    } else {
      // If imap and results are provided, process them directly
      processEmailResults(imap, results, resolve, reject);
    }
  });
};

/**
 * Process email results
 * @param {Imap} imap - IMAP connection
 * @param {Array} results - Email IDs to process
 * @param {Function} resolve - Promise resolve function
 * @param {Function} reject - Promise reject function
 */
const processEmailResults = (imap, results, resolve, reject) => {
  console.log(`Processing ${results.length} emails`);
  
  const processedEmails = [];
  
  const fetch = imap.fetch(results, { bodies: '', markSeen: true });
  
  fetch.on('message', (msg) => {
    msg.on('body', async (stream) => {
      try {
        const parsed = await simpleParser(stream);
        const from = parsed.from.text;
        const subject = parsed.subject;
        const date = parsed.date;
        
        console.log(`Processing email from ${from}, subject: ${subject}`);
        
        // Extract PO reference from subject
        const poRefMatch = subject.match(/PO[-\s]?#?([A-Za-z0-9-]+)/i);
        const poReference = poRefMatch ? poRefMatch[1] : null;
        
        // Extract invoice number from subject
        const invMatch = subject.match(/INV[-\s]?#?([A-Za-z0-9-]+)/i);
        const invoiceNumber = invMatch ? invMatch[1] : `INV-${Date.now()}`;
        
        // Extract vendor name from email
        const vendorMatch = from.match(/([^<]+)/);
        const vendorName = vendorMatch ? vendorMatch[1].trim() : 'Unknown Vendor';
        
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
              
              // Create invoice record with more details
              const invoice = {
                id: `INV${timestamp}`,
                invoiceNumber,
                vendorName,
                vendor: {
                  name: vendorName,
                  email: parsed.from.value[0].address
                },
                senderEmail: from,
                subject,
                receivedDate: date,
                poReference,
                status: 'Received',
                amount: 0, // This would be extracted from the PDF in a real implementation
                filename,
                filepath
              };
              
              processedEmails.push(invoice);
              
              // Emit an event for the frontend
              console.log(`New invoice received: ${invoiceNumber} for PO: ${poReference}`);
              
              // Emit the event using Socket.IO
              if (io) {
                io.emit('newInvoice', { 
                  type: 'NEW_INVOICE',
                  poReference,
                  invoice
                });
                console.log('Invoice event emitted via Socket.IO');
              } else {
                console.log('Socket.IO not available, invoice event not emitted');
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
    console.error('Fetch error:', err);
    reject(err);
  });
  
  fetch.once('end', () => {
    console.log('Done fetching emails');
    imap.end();
    resolve({ 
      success: true, 
      message: `Processed ${processedEmails.length} new emails`, 
      count: processedEmails.length,
      invoices: processedEmails
    });
  });
};

/**
 * Start the email checker service
 */
const startEmailChecker = () => {
  console.log(`Starting email checker service. Will check every ${CHECK_INTERVAL / 60000} minutes.`);
  
  // Initial check
  checkEmailsWithRetry();
  
  // Set up interval for regular checking
  setInterval(checkEmailsWithRetry, CHECK_INTERVAL);
};

/**
 * Check emails with retry logic
 */
const checkEmailsWithRetry = async () => {
  let retries = 3;
  let success = false;
  
  while (retries > 0 && !success) {
    try {
      console.log(`Checking for new emails at ${new Date().toISOString()}`);
      await checkEmails();
      success = true;
    } catch (error) {
      retries--;
      console.error(`Error checking emails (${retries} retries left):`, error.message);
      
      if (error.code === 'ENOTFOUND') {
        console.log('DNS resolution error. Trying with alternative approach...');
        // Try with explicit IP for Gmail's IMAP server
        try {
          // Gmail's IMAP server IP addresses (these can change, but are generally stable)
          const gmailImapIPs = ['64.233.184.108', '74.125.140.108', '74.125.20.108'];
          
          // Try each IP
          for (const ip of gmailImapIPs) {
            try {
              console.log(`Trying alternative IP: ${ip}`);
              const altConfig = { ...imapConfig, host: ip };
              await checkEmailsWithConfig(altConfig);
              success = true;
              break;
            } catch (ipError) {
              console.error(`Failed with IP ${ip}:`, ipError.message);
            }
          }
        } catch (altError) {
          console.error('Alternative approach failed:', altError.message);
        }
      }
      
      if (!success && retries > 0) {
        // Wait before retrying (exponential backoff)
        const waitTime = (4 - retries) * 5000; // 5s, 10s, 15s
        console.log(`Waiting ${waitTime/1000}s before retrying...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  if (!success) {
    console.error('Failed to check emails after multiple retries. Will try again at next interval.');
  }
};

/**
 * Check emails with a specific configuration
 * @param {Object} config - IMAP configuration
 */
const checkEmailsWithConfig = (config) => {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Connecting to IMAP server ${config.host} with user ${config.user}...`);
      const imap = new Imap(config);
      
      // Handle connection errors
      imap.once('error', (err) => {
        console.error('IMAP connection error:', err);
        reject(err);
      });
      
      // Handle successful connection
      imap.once('ready', () => {
        console.log(`Successfully connected to IMAP server as ${config.user}`);
        processEmailsWithImap(imap)
          .then((result) => {
            console.log(`Email processing complete. Found ${result.count || 0} emails.`);
            resolve(result);
          })
          .catch(reject)
          .finally(() => {
            try {
              imap.end();
            } catch (e) {
              console.error('Error ending IMAP connection:', e);
            }
          });
      });
      
      // Handle end of connection
      imap.once('end', () => {
        console.log('IMAP connection ended');
      });
      
      // Connect to the server
      imap.connect();
    } catch (error) {
      console.error('Error creating IMAP connection:', error);
      reject(error);
    }
  });
};

/**
 * Check for new emails and process invoices
 * @returns {Promise<Object>} - Result of email processing
 */
const checkEmails = async () => {
  try {
    return await checkEmailsWithConfig(imapConfig);
  } catch (error) {
    console.error('Error checking emails:', error);
    throw error;
  }
};

module.exports = {
  startEmailChecker,
  checkEmails
}; 