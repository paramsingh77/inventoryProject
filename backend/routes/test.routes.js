const express = require('express');
const router = express.Router();
const { sendMail } = require('../utils/emailService');
const nodemailer = require('nodemailer');
const { generatePurchaseOrderPdf } = require('../utils/emailService');
const { pool } = require('../db/db');
const { pdfGeneratorGenerate } = require('../utils/pdfGenerator');

router.get('/test-email', async (req, res) => {
  try {
    const result = await sendMail({
      from: process.env.EMAIL_FROM || `"Test System" <${process.env.EMAIL_USER}>`,
      to: req.query.email || process.env.EMAIL_USER,
      subject: 'Test Email from Inventory System',
      text: 'This is a test email to verify that email sending is working correctly.',
      html: '<h1>Email Test</h1><p>This is a test email to verify that email sending is working correctly.</p>'
    });
    
    res.json({
      success: result.sent,
      messageId: result.messageId,
      preview: result.preview || null,
      error: result.error ? result.error.message : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/verify-email-sending', async (req, res) => {
  const testEmail = req.query.email || process.env.EMAIL_USER;
  
  try {
    // Test configuration
    const mailConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    };
    
    // Test the connection
    const testTransporter = nodemailer.createTransport(mailConfig);
    const verified = await testTransporter.verify();
    
    // Send a test email
    const result = await sendMail({
      from: process.env.EMAIL_FROM || `"System Test" <${process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: 'Email Delivery Test ' + new Date().toISOString(),
      text: 'This is a test to verify email delivery is working.',
      html: '<h1>Email Delivery Test</h1><p>This test was triggered at ' + new Date().toISOString() + '</p>'
    });
    
    res.json({
      smtpConnectionVerified: verified,
      configuration: {
        ...mailConfig,
        password: '******'  // Hide password
      },
      sendResult: result,
      isLoggedOnly: result.loggedOnly || false,
      isRealSend: result.real || false,
      emailSent: result.sent,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        ENABLE_EMAIL: process.env.ENABLE_EMAIL,
        FORCE_REAL_EMAILS: process.env.FORCE_REAL_EMAILS
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Add a test route to check PDF generation
router.get('/test-pdf/:poId', async (req, res) => {
  try {
    const poId = req.params.poId;
    
    // Get PO data
    const result = await pool.query(
      'SELECT * FROM purchase_orders WHERE id = $1',
      [poId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    
    const po = result.rows[0];
    
    // Get items
    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [poId]
    );
    
    po.items = itemsResult.rows;
    
    // Generate PDF
    const pdfData = await generatePurchaseOrderPdf(po);
    
    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfData.content, 'base64');
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=PO-${po.order_number}.pdf`);
    
    // Send the PDF
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating test PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a direct PDF test endpoint
router.get('/test-direct-pdf/:poId', async (req, res) => {
  try {
    const poId = req.params.poId;
    
    // Get PO data
    const result = await pool.query(
      'SELECT * FROM purchase_orders WHERE id = $1',
      [poId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    
    const po = result.rows[0];
    
    // Get items
    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [poId]
    );
    
    po.items = itemsResult.rows;
    
    // Generate PDF directly
    const pdfBuffer = await pdfGeneratorGenerate(po);
    
    // Log the buffer details
    console.log(`PDF Buffer: ${Buffer.isBuffer(pdfBuffer)}, Length: ${pdfBuffer.length}`);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=PO-${po.order_number}.pdf`);
    
    // Send the PDF
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error in direct PDF test:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 