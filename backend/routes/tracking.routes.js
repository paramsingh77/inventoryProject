const express = require('express');
const router = express.Router();
const { pool } = require('../database/schema');
const emailCheckScheduler = require('../services/emailCheckScheduler');

// Get tracking information for all orders
router.get('/tracking', async (req, res) => {
  try {
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
        total_amount
      FROM purchase_orders
      WHERE shipping_status IS NOT NULL
      ORDER BY last_status_update DESC
    `;
    
    const result = await pool.query(query);
    
    // For each order, get its items
    for (const order of result.rows) {
      const itemsQuery = `
        SELECT * FROM order_items
        WHERE order_id = $1
      `;
      const itemsResult = await pool.query(itemsQuery, [order.id]);
      order.items = itemsResult.rows;
    }
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching tracking information:', error);
    res.status(500).json({ message: 'Error fetching tracking information', error: error.message });
  }
});

// Get tracking for a specific order
router.get('/tracking/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT * FROM purchase_orders
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const order = result.rows[0];
    
    // Get items for this order
    const itemsQuery = `
      SELECT * FROM order_items
      WHERE order_id = $1
    `;
    const itemsResult = await pool.query(itemsQuery, [id]);
    order.items = itemsResult.rows;
    
    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order tracking:', error);
    res.status(500).json({ message: 'Error fetching order tracking', error: error.message });
  }
});

// Manually check for new emails
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

module.exports = router; 