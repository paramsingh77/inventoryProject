const express = require('express');
const router = express.Router();
const { pool } = require('../database/schema');
const emailCheckScheduler = require('../services/emailCheckScheduler');
const fs = require('fs');

// Route to check emails
router.post('/check-emails', async (req, res) => {
  try {
    const emails = await emailCheckScheduler.checkEmailsNow();
    res.status(200).json({ 
      message: 'Email check completed successfully', 
      emailsProcessed: emails.length 
    });
  } catch (error) {
    console.error('Error checking emails:', error);
    res.status(500).json({ message: 'Error checking emails', error: error.message });
  }
});

// Route to view processed emails
router.get('/processed-emails', async (req, res) => {
  try {
    // Get orders with tracking information that were recently updated
    const query = `
      SELECT 
        id, 
        order_number, 
        vendor_name, 
        shipping_status, 
        tracking_number, 
        current_location, 
        estimated_delivery, 
        last_status_update,
        invoice_number,
        invoice_amount,
        invoice_pdf_path,
        total_amount
      FROM purchase_orders
      WHERE shipping_status IS NOT NULL OR invoice_number IS NOT NULL
      ORDER BY last_status_update DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query);
    
    res.status(200).json({
      message: 'Recently processed emails',
      updatedOrders: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching processed emails:', error);
    res.status(500).json({ message: 'Error fetching processed emails', error: error.message });
  }
});

// Route to get a PDF
router.get('/invoice-pdf/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the PO with the PDF path
    const query = `
      SELECT invoice_pdf_path FROM purchase_orders WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0 || !result.rows[0].invoice_pdf_path) {
      return res.status(404).json({ message: 'PDF not found' });
    }
    
    const pdfPath = result.rows[0].invoice_pdf_path;
    
    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ message: 'PDF file not found on server' });
    }
    
    // Send the file
    res.sendFile(pdfPath);
    
  } catch (error) {
    console.error('Error fetching invoice PDF:', error);
    res.status(500).json({ message: 'Error fetching invoice PDF', error: error.message });
  }
});

module.exports = router; 