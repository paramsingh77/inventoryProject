const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { updateOrderFromEmail } = require('./orderTrackingService');

if (!process.env.IMAP_USER) {
  console.log('Setting IMAP variables manually for debugging');
  process.env.IMAP_USER = 'invoice.tester11@gmail.com';
  process.env.IMAP_PASSWORD = 'vmenhgvmrskqzjpx';
  process.env.IMAP_HOST = 'imap.gmail.com';
  process.env.IMAP_PORT = '993';
  process.env.IMAP_TLS = 'true';
}

console.log('IMAP Environment Variables:');
console.log('IMAP_USER:', process.env.IMAP_USER);
console.log('IMAP_HOST:', process.env.IMAP_HOST);
console.log('IMAP_PORT:', process.env.IMAP_PORT);
console.log('IMAP_TLS:', process.env.IMAP_TLS);
console.log('IMAP_TEST_MODE:', process.env.IMAP_TEST_MODE);

class ImapService {
  constructor() {
    // Check if all required env variables exist with explicit logging
    const requiredEnvVars = ['IMAP_USER', 'IMAP_PASSWORD', 'IMAP_HOST', 'IMAP_PORT'];
    for (const varName of requiredEnvVars) {
      console.log(`${varName}:`, process.env[varName] ? 'SET' : 'MISSING');
    }
    
    const missingVars = requiredEnvVars.filter(v => !process.env[v]);
    
    if (missingVars.length > 0) {
      console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
      this.configValid = false;
      return;
    }
    
    this.configValid = true;
    
    // Log IMAP configuration (without password)
    console.log('IMAP configuration:', {
      user: process.env.IMAP_USER,
      host: process.env.IMAP_HOST,
      port: process.env.IMAP_PORT,
      tls: process.env.IMAP_TLS === 'true'
    });
    
    this.imap = new Imap({
      user: process.env.IMAP_USER,
      password: process.env.IMAP_PASSWORD,
      host: process.env.IMAP_HOST,
      port: parseInt(process.env.IMAP_PORT || '993', 10),
      tls: process.env.IMAP_TLS !== 'false', // Default to true if not specified
      tlsOptions: { rejectUnauthorized: false }
    });
    
    this.imap.on('error', (err) => {
      console.error('IMAP connection error:', err);
    });
  }
  
  checkEmails() {
    return new Promise((resolve, reject) => {
      // Check if config is valid
      if (!this.configValid) {
        return reject(new Error('IMAP configuration is invalid. Check environment variables.'));
      }
      
      try {
        // For testing, return empty array if we just want to check the route works
        if (process.env.IMAP_TEST_MODE === 'true') {
          console.log('IMAP test mode enabled, returning empty email array');
          return resolve([]);
        }
        
        this.imap.once('ready', () => {
          this.imap.openBox('INBOX', false, (err, box) => {
            if (err) {
              console.error('Error opening inbox:', err);
              this.imap.end();
              return reject(err);
            }
            
            // Search for unread messages
            this.imap.search(['UNSEEN'], (err, results) => {
              if (err) {
                console.error('Error searching for emails:', err);
                this.imap.end();
                return reject(err);
              }
              
              if (results.length === 0) {
                console.log('No new emails found');
                this.imap.end();
                return resolve([]);
              }
              
              console.log(`Found ${results.length} new emails`);
              
              const f = this.imap.fetch(results, { bodies: '', markSeen: true });
              const emails = [];
              
              f.on('message', (msg, seqno) => {
                msg.on('body', (stream, info) => {
                  simpleParser(stream, async (err, parsed) => {
                    if (err) {
                      console.error('Error parsing email:', err);
                      return;
                    }
                    
                    emails.push(parsed);
                    
                    // Process the email for PO tracking
                    try {
                      await updateOrderFromEmail(parsed);
                    } catch (err) {
                      console.error('Error updating order from email:', err);
                    }
                  });
                });
              });
              
              f.once('error', (err) => {
                console.error('Fetch error:', err);
                reject(err);
              });
              
              f.once('end', () => {
                console.log('Done fetching all messages');
                this.imap.end();
                resolve(emails);
              });
            });
          });
        });
        
        this.imap.once('error', (err) => {
          console.error('IMAP connection error during check:', err);
          reject(err);
        });
        
        console.log('Connecting to IMAP server...');
        this.imap.connect();
        
      } catch (err) {
        console.error('Unexpected error in checkEmails:', err);
        reject(err);
      }
    });
  }
}

module.exports = new ImapService(); 