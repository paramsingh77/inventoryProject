const nodemailer = require('nodemailer');
const { generatePurchaseOrderPdf } = require('./pdfGenerator');
const fs = require('fs');
const path = require('path');
const os = require('os');
const emailConfig = require('../config/email.config');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  debug: true,
  logger: true,
  tls: {
    // do not fail on invalid certs
    rejectUnauthorized: false
  }
});

// Verify connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// Create a safer sendMail function
async function sendMail(options) {
  // Skip if email is disabled
  if (process.env.ENABLE_EMAIL === 'false') {
    console.log('[MAIL] Email sending disabled by configuration');
    console.log('[MAIL] Would send email:', options.to);
    return { messageId: 'disabled', sent: false };
  }
  
  // Always send real emails regardless of environment
  try {
    console.log('[MAIL] Sending email to:', options.to);
    console.log('[MAIL] Has attachments:', options.attachments ? 'Yes' : 'No');
    if (options.attachments) {
      console.log('[MAIL] Attachment count:', options.attachments.length);
      options.attachments.forEach((att, i) => {
        console.log(`[MAIL] Attachment ${i+1}:`, {
          filename: att.filename,
          contentType: att.contentType,
          contentLength: att.content ? att.content.length : 'unknown'
        });
      });
    }
    
    // Set default from address if not specified
    if (!options.from) {
      options.from = process.env.EMAIL_FROM || `"AAM Inventory" <${process.env.EMAIL_USER}>`;
    }
    
    // Log transporter config
    console.log('[MAIL] Transporter config:', {
      service: transporter.options.service,
      host: transporter.options.host,
      port: transporter.options.port,
      secure: transporter.options.secure,
      auth: {
        user: transporter.options.auth.user,
        pass: '(hidden)'
      }
    });
    
    const info = await transporter.sendMail(options);
    console.log('[MAIL] Email sent successfully:', info.messageId);
    return { ...info, sent: true };
  } catch (error) {
    console.error('[MAIL] Email sending error:', error);
    if (error.code === 'EAUTH') {
      console.error('[MAIL] Authentication error - check credentials');
    } else if (error.code === 'ESOCKET') {
      console.error('[MAIL] Socket error - check network/firewall');
    }
    return { error, sent: false };
  }
}

async function sendPurchaseOrderEmail(po, recipientEmail, pdfBuffer) {
  try {
    if (!po || !recipientEmail) {
      throw new Error('Missing required parameters');
    }

    console.log('\n📧 Email Preparation:');
    console.log('- Recipient:', recipientEmail);
    console.log('- PO Number:', po.order_number);
    console.log('- PDF Buffer:', pdfBuffer ? `${pdfBuffer.length} bytes` : 'No buffer');

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"AAM Inventory" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `Purchase Order ${po.order_number}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Purchase Order ${po.order_number}</h2>
          <p>Dear ${po.supplier_name || 'Valued Supplier'},</p>
          <p>Please find attached the purchase order with the following details:</p>
          <ul>
            <li>PO Number: ${po.order_number}</li>
            <li>Date: ${new Date(po.created_at).toLocaleDateString()}</li>
            <li>Total Amount: $${parseFloat(po.total_amount || 0).toFixed(2)}</li>
          </ul>
          <p>Please process this order at your earliest convenience.</p>
          <p>Best regards,<br>AAM Inventory Team</p>
        </div>
      `,
      attachments: []
    };

    // Add PDF attachment if buffer is provided
    if (Buffer.isBuffer(pdfBuffer) && pdfBuffer.length > 0) {
      console.log('📎 Attaching PDF to email...');
      
      mailOptions.attachments.push({
        filename: `PO-${po.order_number}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
      
      console.log('✅ PDF attached successfully');
    } else {
      console.log('⚠️ No valid PDF buffer to attach');
    }

    // Log the final mail options
    console.log('\n📨 Final Mail Options:');
    console.log('- From:', mailOptions.from);
    console.log('- To:', mailOptions.to);
    console.log('- Subject:', mailOptions.subject);
    console.log('- Has Attachments:', mailOptions.attachments.length > 0);
    
    if (mailOptions.attachments.length > 0) {
      console.log('- Attachment Details:', {
        filename: mailOptions.attachments[0].filename,
        contentLength: mailOptions.attachments[0].content.length,
        contentType: mailOptions.attachments[0].contentType
      });
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { sent: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Email service error:', error);
    return { sent: false, error };
  }
}

module.exports = {
  generatePurchaseOrderPdf,
  sendPurchaseOrderEmail,
  sendMail,
  transporter
}; 