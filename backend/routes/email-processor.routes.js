const express = require('express');
const router = express.Router();
const emailProcessor = require('../services/emailProcessor');
const { pool } = require('../database/schema');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Get email processor status
router.get('/email-processor/status', authMiddleware, adminMiddleware, (req, res) => {
  const status = {
    isProcessing: emailProcessor.isProcessing,
    lastCheckTime: emailProcessor.lastCheckTime,
    processedEmailsCount: emailProcessor.processedEmails.size
  };
  
  res.json(status);
});

// Start email processor
router.post('/email-processor/start', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await emailProcessor.startMonitoring();
    res.json({ message: 'Email processor started successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start email processor', message: error.message });
  }
});

// Stop email processor
router.post('/email-processor/stop', authMiddleware, adminMiddleware, (req, res) => {
  try {
    emailProcessor.stopMonitoring();
    res.json({ message: 'Email processor stopped successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to stop email processor', message: error.message });
  }
});

// Get processed emails for a specific PO
router.get('/purchase-orders/:id/emails', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT * FROM email_processing_log
      WHERE po_id = $1
      ORDER BY processed_at DESC
    `;
    
    const result = await pool.query(query, [id]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch email logs', message: error.message });
  }
});

// Get invoices for a specific PO
router.get('/purchase-orders/:id/invoices', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT * FROM invoices
      WHERE po_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [id]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices', message: error.message });
  }
});

// Force check emails now (for testing)
router.post('/email-processor/check-now', async (req, res) => {
  try {
    console.log('Manual email check initiated');
    await emailProcessor.checkEmails();
    res.json({ message: 'Email check initiated successfully' });
  } catch (error) {
    console.error('Failed to check emails:', error);
    res.status(500).json({ error: 'Failed to check emails', message: error.message });
  }
});

module.exports = router; 