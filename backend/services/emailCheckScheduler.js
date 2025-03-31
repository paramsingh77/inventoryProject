const Imap = require('imap');
const { simpleParser } = require('mailparser');
const emailConfig = require('../config/email.config');
const socketUtils = require('../socket');

class EmailCheckScheduler {
  constructor() {
    this.interval = null;
    this.checking = false;
    this.retryCount = 0;
    
    // Add default configuration values
    this.config = {
      mailbox: 'INBOX', // Explicitly set mailbox to INBOX
      searchFilter: ['UNSEEN'],
      fetchLimit: 10,
      markSeen: false,
      errorHandling: {
        ignoreConnectionErrors: true,
        logErrors: true,
        maxRetries: 3,
        retryDelay: 5000
      }
    };
  }

  start() {
    console.log('Starting email check scheduler');
    // Check emails every 5 minutes
    this.interval = setInterval(() => {
      this.checkEmails();
    }, 5 * 60 * 1000);
    
    // Do an initial check
    setTimeout(() => this.checkEmails(), 10000);
  }

  stop() {
    console.log('Stopping email check scheduler');
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  async checkEmailsNow() {
    return this.checkEmails(true);
  }

  async checkEmails(manual = false) {
    if (this.checking) {
      console.log('Email check already in progress, skipping');
      return [];
    }

    this.checking = true;
    console.log(`${manual ? 'Manual' : 'Scheduled'} email check started`);
    
    try {
      const emails = await this.fetchEmails();
      
      if (emails.length > 0) {
        console.log(`Found ${emails.length} new emails`);
        
        // Process emails here
        // ...
        
        // Emit socket event if there are new emails
        const io = socketUtils.getIO();
        if (io) {
          io.emit('newEmails', { count: emails.length });
        }
      } else {
        console.log('No new emails found');
      }
      
      this.retryCount = 0;
      return emails;
    } catch (error) {
      console.error('Error checking emails:', error);
      
      // Implement retry logic
      if (this.retryCount < this.config.errorHandling.maxRetries) {
        this.retryCount++;
        console.log(`Retrying email check (${this.retryCount}/${this.config.errorHandling.maxRetries})`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.config.errorHandling.retryDelay));
        return this.checkEmails(manual);
      }
      
      return [];
    } finally {
      this.checking = false;
    }
  }

  async fetchEmails() {
    return new Promise((resolve, reject) => {
      try {
        // Properly initialize IMAP connection with environment variables
        const imapConfig = {
          user: process.env.IMAP_USER || process.env.EMAIL_USER,
          password: process.env.IMAP_PASSWORD || process.env.EMAIL_PASSWORD,
          host: process.env.IMAP_HOST || 'imap.gmail.com',
          port: parseInt(process.env.IMAP_PORT || '993', 10),
          tls: process.env.IMAP_TLS !== 'false',
          tlsOptions: { rejectUnauthorized: false }
        };

        // Log the configuration for debugging
        console.log('IMAP Configuration:', {
          user: imapConfig.user,
          host: imapConfig.host,
          port: imapConfig.port,
          tls: imapConfig.tls
        });

        // Create connection with proper config
        const connection = new Imap(imapConfig);
        const emails = [];
        
        // Error handling and connection setup
        const handleConnectionError = (err) => {
          // Add a default config with ignoreConnectionErrors if the config is undefined
          const errorConfig = this.config?.errorHandling || {
            ignoreConnectionErrors: true,
            logErrors: true,
            maxRetries: 3,
            retryDelay: 5000
          };
          
          // Now we can safely check the property
          if (errorConfig.ignoreConnectionErrors) {
            console.warn('IMAP connection error (ignored):', err.message);
            return;
          }
          
          console.error('IMAP connection error:', err);
        };
        
        // Handle connection errors
        connection.once('error', (err) => {
          // Use the safe handler that won't throw if config is undefined
          handleConnectionError(err);
          
          if (this.config.errorHandling.ignoreConnectionErrors) {
            console.warn('Ignoring IMAP connection error due to configuration');
            resolve([]); // Return empty array instead of rejecting
          } else {
            reject(err);
          }
        });
        
        connection.once('end', () => {
          console.log('IMAP connection ended');
        });
        
        connection.once('ready', () => {
          console.log('IMAP connection ready');
          
          // Ensure we have a valid mailbox name
          const mailboxName = this.config.mailbox || 'INBOX';
          console.log(`Opening mailbox: ${mailboxName}`);
          
          // Open mailbox
          connection.openBox(mailboxName, false, (err, box) => {
            if (err) {
              console.error('Error opening mailbox:', err);
              connection.end();
              return reject(err);
            }
            
            console.log(`Mailbox opened: ${box.name}`);
            
            // Search for emails
            connection.search(this.config.searchFilter, (err, results) => {
              if (err) {
                console.error('Error searching emails:', err);
                connection.end();
                return reject(err);
              }
              
              if (results.length === 0) {
                console.log('No matching emails found');
                connection.end();
                return resolve([]);
              }
              
              console.log(`Found ${results.length} matching emails`);
              
              // Limit the number of emails to fetch
              const fetchResults = results.slice(0, this.config.fetchLimit);
              
              const fetch = connection.fetch(fetchResults, {
                bodies: '',
                markSeen: this.config.markSeen
              });
              
              fetch.on('message', (msg, seqno) => {
                console.log(`Processing email #${seqno}`);
                
                msg.on('body', (stream, info) => {
                  let buffer = '';
                  
                  stream.on('data', (chunk) => {
                    buffer += chunk.toString('utf8');
                  });
                  
                  stream.once('end', () => {
                    // Parse email
                    simpleParser(buffer)
                      .then(email => {
                        console.log(`Email parsed: ${email.subject}`);
                        emails.push(email);
                      })
                      .catch(err => {
                        console.error('Error parsing email:', err);
                      });
                  });
                });
                
                msg.once('end', () => {
                  console.log(`Email #${seqno} processed`);
                });
              });
              
              fetch.once('error', (err) => {
                console.error('Error fetching emails:', err);
                connection.end();
                reject(err);
              });
              
              fetch.once('end', () => {
                console.log('All emails fetched');
                connection.end();
                resolve(emails);
              });
            });
          });
        });
        
        // Connect to the server
        connection.connect();
      } catch (error) {
        console.error('Error creating IMAP connection:', error);
        reject(error);
      }
    });
  }
}

module.exports = new EmailCheckScheduler(); 