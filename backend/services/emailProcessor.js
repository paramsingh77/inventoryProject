const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const path = require('path');
let pdfParse = null;

// Try to load pdf-parse, but don't crash if it's not available
try {
  pdfParse = require('pdf-parse');
} catch (error) {
  console.warn('pdf-parse module not found. PDF content extraction will be disabled.');
}

const { pool } = require('../database/schema');
const socketIO = require('../socket');

// Use console.log as fallback if logger module is not available
let logger;
try {
  logger = require('../utils/logger');
} catch (error) {
  logger = {
    info: console.log,
    error: console.error,
    warn: console.warn,
    debug: console.log
  };
  console.warn('Logger module not found. Using console for logging.');
}

// Configuration for email processing
const config = {
  checkInterval: process.env.EMAIL_CHECK_INTERVAL || 200000, // 5 minutes by default
  poNumberRegex: /PO-\d{4}-\d{6}-\d{4}/g, // Matches PO-2025-431261-2567 format
  statusKeywords: {
    shipped: ['shipped', 'dispatched', 'on its way', 'in transit', 'delivery initiated'],
    delivered: ['delivered', 'received', 'completed', 'fulfilled'],
    delayed: ['delayed', 'postponed', 'on hold', 'backorder'],
    cancelled: ['cancelled', 'canceled', 'order canceled', 'terminated'],
    partial: ['partial', 'partially fulfilled', 'partial shipment'],
    Invoice_Generated: ['invoice sent'],
  },
  attachmentTypes: {
    invoice: ['.pdf', '.docx', '.doc', '.xls', '.xlsx', '.csv'],
    image: ['.jpg', '.jpeg', '.png', '.gif', '.tiff']
  }
};

class EmailProcessor {
  constructor() {
    this.imap = null;
    this.isProcessing = false;
    this.lastCheckTime = null;
    this.processedEmails = new Set();
    this.initializeImap();
  }

  initializeImap() {
    try {
      const imapConfig = {
        user: process.env.IMAP_USER,
        password: process.env.IMAP_PASSWORD,
        host: process.env.IMAP_HOST,
        port: parseInt(process.env.IMAP_PORT || '993', 10),
        tls: true,
        tlsOptions: {
          rejectUnauthorized: true,
          servername: process.env.IMAP_HOST
        },
        keepalive: {
          interval: 10000, // 10 seconds
          idleTimeout: 300000, // 5 minutes
          forceNoop: true
        },
        authTimeout: 30000, // 30 seconds
        connTimeout: 30000, // 30 seconds
      };

      logger.info('Initializing IMAP client with config:', {
        user: imapConfig.user,
        host: imapConfig.host,
        port: imapConfig.port,
        tls: imapConfig.tls
      });

      this.imap = new Imap(imapConfig);

      // Set up event handlers
      this.imap.on('error', (err) => {
        logger.error('IMAP connection error:', err);
        // Try to reconnect on error after a delay
        setTimeout(() => {
          if (!this.imap || this.imap.state === 'disconnected') {
            logger.info('Attempting to reconnect after error...');
            this.initializeImap();
          }
        }, 60000); // Wait 1 minute before reconnecting
      });

      this.imap.on('end', () => {
        logger.info('IMAP connection ended');
      });

      logger.info('IMAP client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize IMAP client:', error);
      throw error; // Propagate the error up
    }
  }

  async startMonitoring() {
    if (this.isProcessing) {
      logger.warn('Email processing already in progress');
      return;
    }

    try {
      this.isProcessing = true;
      logger.info('Starting email monitoring service');
      
      // Schedule regular checks
      this.scheduleNextCheck();
    } catch (error) {
      logger.error('Error starting email monitoring:', error);
      this.isProcessing = false;
    }
  }

  scheduleNextCheck() {
    setTimeout(() => {
      this.checkEmails()
        .then(() => {
          this.lastCheckTime = new Date();
          logger.info(`Email check completed at ${this.lastCheckTime}`);
        })
        .catch(error => {
          logger.error('Error during email check:', error);
        })
        .finally(() => {
          this.scheduleNextCheck();
        });
    }, config.checkInterval);
  }

  async checkEmails() {
    return new Promise((resolve, reject) => {
      try {
        logger.info('Attempting to connect to IMAP server...');
        logger.debug('IMAP Config:', {
          user: process.env.IMAP_USER,
          host: process.env.IMAP_HOST,
          port: process.env.IMAP_PORT,
          tls: process.env.IMAP_TLS
        });
        
        this.imap.connect();
        
        this.imap.once('ready', () => {
          logger.info('IMAP connection established successfully');
          this.imap.openBox('INBOX', false, (err, box) => {
            if (err) {
              logger.error('Failed to open INBOX:', err);
              this.imap.end();
              return reject(err);
            }
            
            logger.info('INBOX opened successfully');
            // Search for unread emails
            const searchCriteria = ['UNSEEN'];
            this.imap.search(searchCriteria, (err, results) => {
              if (err) {
                logger.error('Failed to search for unread emails:', err);
                this.imap.end();
                return reject(err);
              }
              
              if (!results || results.length === 0) {
                logger.info('No new emails found');
                this.imap.end();
                return resolve();
              }
              
              logger.info(`Found ${results.length} new emails`);
              
              // Process each email
              const fetch = this.imap.fetch(results, { bodies: '', markSeen: true });
              
              fetch.on('message', (msg, seqno) => {
                logger.info(`Processing email #${seqno}`);
                this.processEmail(msg, seqno);
              });
              
              fetch.once('error', (err) => {
                logger.error('Error fetching emails:', err);
                this.imap.end();
                reject(err);
              });
              
              fetch.once('end', () => {
                logger.info('Done fetching all emails');
                this.imap.end();
                resolve();
              });
            });
          });
        });
        
        this.imap.once('error', (err) => {
          logger.error('IMAP connection error during check:', err, {
            stack: err.stack,
            code: err.code,
            source: err.source
          });
          reject(err);
        });
        
        this.imap.once('end', () => {
          logger.info('IMAP connection ended normally');
        });
      } catch (error) {
        logger.error('Error in checkEmails:', error, {
          stack: error.stack,
          code: error.code,
          source: error.source
        });
        reject(error);
      }
    });
  }

  processEmail(msg, seqno) {
    console.log(`Starting to process email #${seqno}`);
    const emailData = {
      seqno,
      attachments: [],
      poNumbers: [],
      statusUpdates: []
    };
    
    msg.on('body', (stream) => {
      console.log(`Parsing email body for #${seqno}`);
      simpleParser(stream, async (err, parsed) => {
        if (err) {
          console.error(`Error parsing email #${seqno}:`, err);
          return;
        }
        
        try {
          console.log(`Successfully parsed email #${seqno}`);
          // Store basic email info
          emailData.id = parsed.messageId;
          emailData.from = parsed.from.text;
          emailData.subject = parsed.subject;
          emailData.date = parsed.date;
          emailData.text = parsed.text;
          emailData.html = parsed.html;
          
          console.log(`Email details:`, {
            id: emailData.id,
            from: emailData.from,
            subject: emailData.subject,
            date: emailData.date
          });
          
          // Skip if we've already processed this email
          if (this.processedEmails.has(emailData.id)) {
            console.log(`Email ${emailData.id} already processed, skipping`);
            return;
          }
          
          // Extract PO numbers from subject and body
          emailData.poNumbers = this.extractPONumbers(parsed.subject + ' ' + parsed.text);
          console.log(`Found PO numbers:`, emailData.poNumbers);
          
          if (emailData.poNumbers.length === 0) {
            console.log(`No PO numbers found in email #${seqno}`);
            return;
          }
          
          // Extract status updates from email body
          emailData.statusUpdates = this.extractStatusUpdates(parsed.text);
          console.log(`Found status updates:`, emailData.statusUpdates);
          
          // Process each PO number found in the email
          for (const poNumber of emailData.poNumbers) {
            console.log(`Processing PO number: ${poNumber}`);
            await this.processPurchaseOrder(poNumber, emailData);
          }
          
          // Mark as processed
          this.processedEmails.add(emailData.id);
          console.log(`Email ${emailData.id} marked as processed`);
          
        } catch (error) {
          console.error(`Error processing email #${seqno}:`, error);
        }
      });
    });

    msg.once('error', err => {
      console.error(`Error in message event for #${seqno}:`, err);
    });

    msg.once('end', () => {
      console.log(`Finished processing message #${seqno}`);
    });
  }

  extractPONumbers(text) {
    console.log('Extracting PO numbers from text:', text);
    console.log('Using regex pattern:', config.poNumberRegex);
    const matches = text.match(config.poNumberRegex) || [];
    console.log('Found PO numbers:', matches);
    return [...new Set(matches)]; // Remove duplicates
  }

  extractStatusUpdates(text) {
    console.log('Extracting status updates from text:', text);
    const statusUpdates = [];
    const lowerText = text.toLowerCase();
    
    // Check for each status keyword
    for (const [status, keywords] of Object.entries(config.statusKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          console.log(`Found status keyword "${keyword}" for status "${status}"`);
          statusUpdates.push({
            status,
            keyword,
            context: this.extractContext(lowerText, keyword.toLowerCase(), 100)
          });
          break; // Found a match for this status, move to next status
        }
      }
    }
    
    console.log('Extracted status updates:', statusUpdates);
    return statusUpdates;
  }

  extractContext(text, keyword, contextLength = 100) {
    const index = text.indexOf(keyword);
    if (index === -1) return '';
    
    const start = Math.max(0, index - contextLength / 2);
    const end = Math.min(text.length, index + keyword.length + contextLength / 2);
    
    return text.substring(start, end).trim();
  }

  isPdfInvoice(filename) {
    const ext = path.extname(filename).toLowerCase();
    return config.attachmentTypes.invoice.includes(ext);
  }

  async extractInvoiceData(pdfBuffer) {
    try {
      if (!pdfParse) {
        logger.warn('PDF parsing is disabled because pdf-parse module is not installed');
        return {
          invoiceNumber: null,
          invoiceDate: null,
          invoiceAmount: null,
          extracted: false,
          reason: 'pdf-parse module not installed'
        };
      }
      
      const data = await pdfParse(pdfBuffer);
      const text = data.text;
      
      // Extract invoice number (common formats)
      const invoiceNumberRegex = /inv[oice]*[\s#:]*([A-Za-z0-9\-]+)/i;
      const invoiceMatch = text.match(invoiceNumberRegex);
      
      // Extract date (common formats)
      const dateRegex = /date[\s:]*([A-Za-z0-9\-\/\.]+)/i;
      const dateMatch = text.match(dateRegex);
      
      // Extract amount (common formats)
      const amountRegex = /(?:total|amount|sum)[\s:]*[$£€]?\s*([0-9,]+\.[0-9]{2})/i;
      const amountMatch = text.match(amountRegex);
      
      return {
        invoiceNumber: invoiceMatch ? invoiceMatch[1] : null,
        invoiceDate: dateMatch ? dateMatch[1] : null,
        invoiceAmount: amountMatch ? parseFloat(amountMatch[1].replace(',', '')) : null,
        extracted: true
      };
    } catch (error) {
      logger.error('Error extracting invoice data:', error);
      return {
        invoiceNumber: null,
        invoiceDate: null,
        invoiceAmount: null,
        extracted: false,
        reason: error.message
      };
    }
  }

  async processPurchaseOrder(poNumber, emailData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if PO exists and is approved
      const poQuery = `
        SELECT * FROM purchase_orders 
        WHERE order_number = $1
      `;
      
      const poResult = await client.query(poQuery, [poNumber]);
      
      if (poResult.rows.length === 0) {
        logger.warn(`PO ${poNumber} not found in database`);
        return;
      }
      
      const po = poResult.rows[0];
      logger.info(`Found PO ${poNumber} in database with status: ${po.status}`);
      
      // Process status updates
      if (emailData.statusUpdates.length > 0) {
        await this.updatePOStatus(client, po, emailData.statusUpdates);
      }
      
      // Process invoice attachments
      if (emailData.attachments.length > 0) {
        await this.processInvoiceAttachments(client, po, emailData.attachments);
      }
      
      // Update email processing record
      await this.recordEmailProcessing(client, po.id, emailData);
      
      await client.query('COMMIT');
      
      // Emit socket event for real-time updates
      this.emitPOUpdateEvent(po.id, poNumber);
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error processing PO ${poNumber}:`, error);
    } finally {
      client.release();
    }
  }

  async updatePOStatus(client, po, statusUpdates) {
    try {
      // Determine the most relevant status update
      const primaryStatus = this.determinePrimaryStatus(statusUpdates);
      
      if (!primaryStatus) {
        logger.info(`No actionable status updates found for PO ${po.order_number}`);
        return;
      }
      
      // Extract tracking number if present
      const trackingNumber = this.extractTrackingNumber(statusUpdates);
      
      // Update the PO status
      const updateQuery = `
        UPDATE purchase_orders
        SET 
          shipping_status = $1,
          tracking_number = $2,
          last_status_update = CURRENT_TIMESTAMP,
          status_notes = $3
        WHERE id = $4
      `;
      
      const statusNotes = JSON.stringify(statusUpdates);
      
      await client.query(updateQuery, [
        primaryStatus.status,
        trackingNumber,
        statusNotes,
        po.id
      ]);
      
      logger.info(`Updated PO ${po.order_number} status to ${primaryStatus.status}`);
      
    } catch (error) {
      logger.error(`Error updating PO status for ${po.order_number}:`, error);
      throw error;
    }
  }

  async processInvoiceAttachments(client, po, attachments) {
    // Filter for invoice attachments
    const invoiceAttachments = attachments.filter(att => this.isPdfInvoice(att.filename));
    
    if (invoiceAttachments.length === 0) return;
    
    logger.info(`Processing ${invoiceAttachments.length} invoice attachments for PO ${po.order_number}`);
    
    for (const attachment of invoiceAttachments) {
      try {
        // Save attachment to disk
        const attachmentDir = path.join(__dirname, '../uploads/invoices');
        if (!fs.existsSync(attachmentDir)) {
          fs.mkdirSync(attachmentDir, { recursive: true });
        }
        
        const filename = `invoice_${po.id}_${Date.now()}_${attachment.filename}`;
        const filepath = path.join(attachmentDir, filename);
        
        fs.writeFileSync(filepath, attachment.content);
        
        // Extract invoice data if not already done
        let invoiceData = attachment.invoiceData;
        if (!invoiceData) {
          invoiceData = await this.extractInvoiceData(attachment.content);
        }
        
        // Store invoice in database
        const insertInvoiceQuery = `
          INSERT INTO invoices (
            po_id,
            invoice_number,
            invoice_date,
            invoice_amount,
            file_path,
            file_name,
            content_type,
            status,
            created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
          RETURNING *
        `;
        
        const invoiceValues = [
          po.id,
          invoiceData.invoiceNumber || `INV-${Date.now()}`,
          invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : new Date(),
          invoiceData.invoiceAmount || po.total_amount,
          filepath,
          attachment.filename,
          attachment.contentType,
          'received'
        ];
        
        const invoiceResult = await client.query(insertInvoiceQuery, invoiceValues);
        const invoice = invoiceResult.rows[0];
        
        logger.info(`Saved invoice ${invoice.id} for PO ${po.order_number}`);
        
        // Update PO to indicate invoice received
        const updatePoQuery = `
          UPDATE purchase_orders
          SET 
            has_invoice = true,
            invoice_received_date = CURRENT_TIMESTAMP,
            last_status_update = CURRENT_TIMESTAMP
          WHERE id = $1
        `;
        
        await client.query(updatePoQuery, [po.id]);
        
      } catch (error) {
        logger.error(`Error processing invoice attachment for PO ${po.order_number}:`, error);
      }
    }
  }

  async recordEmailProcessing(client, poId, emailData) {
    const insertQuery = `
      INSERT INTO email_processing_log (
        po_id,
        email_id,
        sender,
        subject,
        processed_at,
        status_updates,
        has_attachments,
        attachment_count
      )
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      poId,
      emailData.id,
      emailData.from,
      emailData.subject,
      JSON.stringify(emailData.statusUpdates),
      emailData.attachments.length > 0,
      emailData.attachments.length
    ];
    
    const result = await client.query(insertQuery, values);
    logger.info(`Recorded email processing for PO ID ${poId}`);
    return result.rows[0];
  }

  emitPOUpdateEvent(poId, poNumber) {
    try {
      if (socketIO && typeof socketIO.getIO === 'function') {
        const io = socketIO.getIO();
        
        io.emit('po_update', {
          poId,
          poNumber,
          updateType: 'vendor_response',
          timestamp: new Date().toISOString()
        });
        
        logger.info(`Emitted socket event for PO ${poNumber} update`);
      }
    } catch (error) {
      logger.error(`Error emitting socket event for PO ${poNumber}:`, error);
    }
  }

  stopMonitoring() {
    this.isProcessing = false;
    if (this.imap && this.imap.state !== 'disconnected') {
      this.imap.end();
    }
    logger.info('Email monitoring service stopped');
  }

  determinePrimaryStatus(statusUpdates) {
    if (!statusUpdates || statusUpdates.length === 0) return null;
    
    // Priority order for status updates (most important first)
    const priorityOrder = ['cancelled', 'delivered', 'shipped', 'partial', 'delayed'];
    
    // Find the highest priority status in the updates
    for (const priority of priorityOrder) {
      const matchingUpdate = statusUpdates.find(update => update.status === priority);
      if (matchingUpdate) {
        return matchingUpdate;
      }
    }
    
    // If no priority match found, return the first status update
    return statusUpdates[0];
  }

  extractTrackingNumber(statusUpdates) {
    // Common patterns for tracking numbers in email text
    const trackingPatterns = [
      /tracking\s*(?:number|#|no|code)?\s*:?\s*([A-Z0-9]{8,30})/i,
      /track\s*(?:number|#)?\s*:?\s*([A-Z0-9]{8,30})/i,
      /shipment\s*(?:number|#)?\s*:?\s*([A-Z0-9]{8,30})/i,
      /package\s*(?:number|#)?\s*:?\s*([A-Z0-9]{8,30})/i
    ];
    
    // Check each status update context for tracking numbers
    for (const update of statusUpdates) {
      if (!update.context) continue;
      
      for (const pattern of trackingPatterns) {
        const match = update.context.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
    }
    
    return null;
  }
}

module.exports = new EmailProcessor();