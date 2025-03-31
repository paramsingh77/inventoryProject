const Imap = require('imap');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const emailConfig = require('../config/email.config');
const logger = console; // Replace with your logging system

class EmailService {
  constructor(config = emailConfig) {
    this.config = config;
    this.imap = null;
    this.connected = false;
    this.retryCount = 0;
    this.transporter = nodemailer.createTransport(config.smtp);
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        // Close any existing connection
        if (this.imap && this.imap.state !== 'disconnected') {
          this.imap.end();
        }

        // Create new connection
        this.imap = new Imap({
          ...this.config.imap,
          debug: process.env.NODE_ENV === 'development' ? console.log : null
        });

        // Set up event handlers
        this.imap.once('ready', () => {
          logger.info('IMAP connection established');
          this.connected = true;
          this.retryCount = 0;
          resolve(true);
        });

        this.imap.once('error', (err) => {
          logger.error('IMAP connection error:', err);
          this.connected = false;
          
          if (this.config.errorHandling?.ignoreConnectionErrors) {
            logger.warn('Ignoring IMAP connection error due to configuration');
            resolve(false); // Resolve with false instead of rejecting
          } else {
            reject(err);
          }
        });

        this.imap.once('end', () => {
          logger.info('IMAP connection ended');
          this.connected = false;
        });

        // Connect to server
        this.imap.connect();
      } catch (error) {
        logger.error('Error creating IMAP connection:', error);
        reject(error);
      }
    });
  }

  // Add other methods for email operations...

  // Method to send PO approval emails
  async sendPOApprovalEmail(poData) {
    try {
      // Check if vendor email exists
      if (!poData.vendorEmail && !poData.vendor?.email) {
        throw new Error(`No vendor email found for PO ${poData.poNumber}`);
      }

      const vendorEmail = poData.vendorEmail || poData.vendor.email;
      
      logger.info(`Sending PO approval email to ${vendorEmail} for PO ${poData.poNumber}`);
      
      const mailOptions = {
        from: this.config.smtp.auth.user,
        to: vendorEmail,
        subject: `Purchase Order ${poData.poNumber} Approved`,
        text: `Your purchase order ${poData.poNumber} has been approved.`,
        html: `<p>Your purchase order <strong>${poData.poNumber}</strong> has been approved.</p>`,
        // Add attachments if needed
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${result.messageId}`);
      return result;
    } catch (error) {
      logger.error('Error sending PO approval email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService(); 