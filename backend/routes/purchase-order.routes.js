const express = require('express');
const router = express.Router();
const { pool } = require('../database/schema'); // Import database connection
const { generatePurchaseOrderPdf, sendPurchaseOrderEmail } = require('../utils/emailService');
const emailCheckScheduler = require('../services/emailCheckScheduler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');
const socketIO = require('../socket');
const { generatePurchaseOrderPdf: pdfGeneratorGenerate } = require('../utils/pdfGenerator');
const { format } = require('pg');
const { shouldUseSiteTables } = require('../utils/siteUtils');

// Apply middleware to all routes that need authentication
router.use(authMiddleware);

// Admin check middleware (implement as needed)
const adminMiddleware = (req, res, next) => {
    // Check if user is an admin
    // For demonstration, always allow
    next();
};

// Routes

// IMPORTANT: Place all FIXED PATH routes BEFORE any parameterized routes
// ====================================================================

// Test routes
router.get('/test', (req, res) => {
  res.json({ message: 'Purchase order routes are working' });
});

router.get('/test-route', (req, res) => {
  console.log('Test route hit without DB access');
  res.json({ message: 'Test route works' });
});

router.get('/test-db', async (req, res) => {
  try {
    console.log('Testing DB connection...');
    const result = await pool.query('SELECT NOW()');
    res.json({
      message: 'Database connection successful',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    res.status(500).json({
      error: 'Database connection failed',
      details: error.message
    });
  }
});
// from where this route is called?
// 
router.get('/', async (req, res) => {
  console.log('🔴 [PURCHASE_ORDER_ROUTES] GET /purchase-orders request received:', {
    query: req.query,
    timestamp: new Date().toISOString()
  });

  const { siteId } = req.query;
  
  console.log('🔴 [PURCHASE_ORDER_ROUTES] Extracted siteId from query:', {
    siteId: siteId,
    type: typeof siteId,
    timestamp: new Date().toISOString()
  });

  // if (!siteId) {
  //   console.error('❌ [PURCHASE_ORDER_ROUTES] No siteId provided in request');
  //   // return res.status(400).json({ error: 'Site ID is required' });
  // }

  const client = await pool.connect();
  try {
    // Check if we should use site-specific tables
    const useSiteTables = await shouldUseSiteTables(siteId);
    console.log('🔴 [PURCHASE_ORDER_ROUTES] Table strategy decision:', {
      siteId: siteId,
      useSiteTables: useSiteTables,
      timestamp: new Date().toISOString()
    });

    if (useSiteTables) {
      // Get site name
      const siteResult = await client.query(
        'SELECT name FROM sites WHERE id = $1',
        [siteId]
      );
      
      const siteName = siteResult.rows[0].name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');

      // Use site-specific tables
      const query = format(`
        SELECT po.*, 
               u.username as ordered_by_name,
               s.name as supplier_name
        FROM %I_purchase_orders po
        LEFT JOIN users u ON po.ordered_by = u.id
        LEFT JOIN %I_suppliers s ON po.supplier_id = s.id
        ORDER BY po.created_at DESC
      `, siteName, siteName);
      
      const result = await client.query(query);
      res.json(result.rows);
    } else {
      // Use old tables with site_id filter
      const query = `
        SELECT po.*, 
               s.name as supplier_name
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        WHERE po.site_id = $1
        ORDER BY po.created_at DESC
      `;
      
      const result = await client.query(query, [siteId]);
      res.json(result.rows);
    }
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});


// Debug endpoint - must be BEFORE any /:id routes
router.get('/debug-all', async (req, res) => {
  try {
    console.log('Checking for any orders in the database...');
    // FIXED: Use correct column name 'order_number' instead of 'po_number'
    const query = `SELECT id, order_number, status FROM purchase_orders LIMIT 10`;
    const result = await pool.query(query);
    
    console.log(`Found ${result.rows.length} orders in total`);
    res.json({
      totalOrders: result.rows.length,
      orders: result.rows
    });
  } catch (error) {
    console.error('Error checking all orders:', error);
    res.status(500).json({ error: 'Failed to check orders', details: error.message });
  }
});

// Update the history route to be more flexible
router.get('/history', async (req, res) => {
  console.log('🔍 ORDER HISTORY ROUTE HIT at', new Date().toISOString());
  
  try {
    console.log('Testing basic DB access...');
    await pool.query('SELECT 1');
    
    // Check if the purchase_orders table exists and has data
    const countCheck = await pool.query(`
      SELECT COUNT(*) as total FROM purchase_orders
    `);
    
    console.log(`Total orders in database: ${countCheck.rows[0].total}`);
    
    // If no orders match 'approved' or 'rejected', let's show some orders anyway in dev mode
    const query = `
      SELECT * 
      FROM purchase_orders 
      ORDER BY created_at DESC
      LIMIT 10;
    `;
    
    const result = await pool.query(query);
    console.log(`Query returned ${result.rows.length} rows`);
    
    if (result.rows.length > 0) {
      console.log('First row:', result.rows[0]);
      console.log('Available statuses:', [...new Set(result.rows.map(row => row.status))]);
    }
    
    // In development, send ALL orders for testing
    res.json(result.rows);
    
  } catch (error) {
    console.error('🚨 DETAILED ERROR in history route:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ error: 'Failed to fetch order history', details: error.message });
  }
});

// Processed emails route
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
        total_amount
      FROM purchase_orders
      WHERE shipping_status IS NOT NULL
      ORDER BY last_status_update DESC
      LIMIT 5
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

// Check emails route
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

// Tracking route
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

// Status route
router.get('/status/:status', async (req, res) => {
    try {
        const { status } = req.params;
        console.log('Status:', status);
        const query = `
            SELECT po.*, 
                   u.username as ordered_by_name,
                   s.name as supplier_name
            FROM purchase_orders po
            LEFT JOIN users u ON po.ordered_by = u.id
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            WHERE po.status = $1
            ORDER BY po.created_at DESC
        `;
        
        const result = await pool.query(query, [status]);
        const purchaseOrders = result.rows;
        
        // For each purchase order, fetch its items
        for (const order of purchaseOrders) {
            const itemsQuery = `
                SELECT * FROM order_items 
                WHERE order_id = $1
            `;
            const itemsResult = await pool.query(itemsQuery, [order.id]);
            order.items = itemsResult.rows;
        }
        
        res.status(200).json(purchaseOrders);
    } catch (error) {
        console.error(`Error fetching ${req.params.status} purchase orders:`, error);
        res.status(500).json({ message: `Error fetching ${req.params.status} purchase orders`, error: error.message });
    }
});

// Schema check route
router.get('/check-schema', async (req, res) => {
    try {
        console.log('Checking database schema');
        
        const client = await pool.connect();
        try {
            // Check if purchase_orders table exists
            const purchaseOrdersTable = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'purchase_orders'
                );
            `);
            
            // Check if order_items table exists
            const orderItemsTable = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'order_items'
                );
            `);
            
            // Get purchase_orders columns
            let purchaseOrdersColumns = [];
            if (purchaseOrdersTable.rows[0].exists) {
                const poColumnsResult = await client.query(`
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_name = 'purchase_orders'
                    ORDER BY ordinal_position;
                `);
                purchaseOrdersColumns = poColumnsResult.rows;
            }
            
            // Get order_items columns
            let orderItemsColumns = [];
            if (orderItemsTable.rows[0].exists) {
                const itemsColumnsResult = await client.query(`
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_name = 'order_items'
                    ORDER BY ordinal_position;
                `);
                orderItemsColumns = itemsColumnsResult.rows;
            }
            
            // Send schema information
            res.json({
                purchaseOrdersTableExists: purchaseOrdersTable.rows[0].exists,
                orderItemsTableExists: orderItemsTable.rows[0].exists,
                purchaseOrdersColumns,
                orderItemsColumns,
                checkTimestamp: new Date().toISOString()
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error checking schema:', error);
        res.status(500).json({
            message: 'Error checking database schema',
            error: error.message
        });
    }
});

// Pending orders route
router.get('/pending', async (req, res) => {
    //  console.log('Fetching pending purchase ordersssssss');
    try {
        const query = `
            SELECT po.*, 
                   u.username as ordered_by_name,
                   s.name as supplier_name,
                   s.email as supplier_email
            FROM purchase_orders po
            LEFT JOIN users u ON po.ordered_by = u.id
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            WHERE po.status = 'pending'
            ORDER BY po.created_at DESC
        `;
        
        const result = await pool.query(query);
        const pendingOrders = result.rows;
        
        // For each pending order, fetch its items
        for (const order of pendingOrders) {
            const itemsQuery = `
                SELECT * FROM order_items 
                WHERE order_id = $1
            `;
            const itemsResult = await pool.query(itemsQuery, [order.id]);
            order.items = itemsResult.rows;
        }
        
        res.status(200).json(pendingOrders);
    } catch (error) {
        console.error('Error fetching pending purchase orders:', error);
        res.status(500).json({ message: 'Error fetching pending purchase orders', error: error.message });
    }
});

// IMPORTANT: Place all specific routes BEFORE any parameterized routes (/:id)
// ========================================================================

// Check updates route - MUST be before any /:id routes
router.get('/check-updates', async (req, res) => {
  try {
    console.log('Starting email update check...');
    // Check for new emails and update existing orders
    const updatedOrders = await checkEmailsForUpdates();
    
    console.log(`Found ${updatedOrders.length} updated orders`);
    
    if (updatedOrders.length > 0 && req.app.get('io')) {
      req.app.get('io').emit('orders-updated', updatedOrders);
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Update check completed', 
      updatedCount: updatedOrders.length 
    });
  } catch (error) {
    console.error('Error checking for updates:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Email webhook route - MUST be before any /:id routes
router.post('/email-webhook', async (req, res) => {
  try {
    console.log('Email webhook received');
    const { subject, sender, body, attachments } = req.body;
    
    // Check if this is an invoice email
    if (subject && (subject.toLowerCase().includes('invoice') || subject.toLowerCase().includes('order'))) {
      console.log('Invoice email detected:', subject);
      
      // Extract order details from email
      const orderDetails = extractOrderDetailsFromEmail(body);
      
      // Generate a unique order number if not extracted
      const orderNumber = orderDetails.orderNumber || `PO-${Date.now()}`;
      const vendor = orderDetails.vendor || extractVendorFromEmail(sender);
      
      // FIXED: Include both po_number and order_number columns to satisfy database constraints
      const insertOrderQuery = `
        INSERT INTO purchase_orders (
          po_number,
          order_number,
          vendor_name,
          shipping_status,
          total_amount,
          status,
          site_id,
          created_at,
          last_status_update
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      // FIXED: Get default site_id for email webhook POs
      // For email webhooks, we'll use a default site or try to infer from context
      const defaultSiteResult = await pool.query('SELECT id FROM sites WHERE name = $1', ['Amarillo Specialty Hospital']);
      const defaultSiteId = defaultSiteResult.rows.length > 0 ? defaultSiteResult.rows[0].id : null;
      
      console.log('🔴 [EMAIL_WEBHOOK] Using default site_id for email webhook PO:', defaultSiteId);
      
      // FIXED: Include both po_number and order_number values to satisfy database constraints
      const orderValues = [
        orderNumber,  // po_number
        orderNumber,  // order_number (same value for both columns)
        vendor,
        'Shipped',
        0, // Default total amount, update as needed
        'shipped', // Status for tracking
        defaultSiteId // FIXED: Add site_id
      ];
      
      console.log('Inserting new order with values:', orderValues);
      const orderResult = await pool.query(insertOrderQuery, orderValues);
      const newOrder = orderResult.rows[0];
      
      console.log('New order tracking card created:', newOrder.order_number);
      
      // If we have items, insert them as well
      if (orderDetails.items && orderDetails.items.length > 0) {
        for (const item of orderDetails.items) {
          const insertItemQuery = `
            INSERT INTO order_items (
              order_id,
              item_type,
              quantity,
              notes
            )
            VALUES ($1, $2, $3, $4)
          `;
          
          await pool.query(insertItemQuery, [
            newOrder.id,
            item.type || 'product',
            item.quantity || 1,
            item.name || 'Item from invoice'
          ]);
        }
      }
      
      // Emit event for real-time updates to frontend if socket is available
      if (req.app.get('io')) {
        req.app.get('io').emit('new-order', newOrder);
      }
      
      res.status(201).json({ 
        success: true, 
        message: 'Order created from email', 
        order: newOrder 
      });
    } else {
      // Not an invoice email
      console.log('Email received but not an invoice:', subject || 'No subject');
      res.status(200).json({ success: true, message: 'Email received but not an invoice' });
    }
  } catch (error) {
    console.error('Error processing email:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Purchase Order Routes Documentation
 * =================================
 * This file contains routes for managing purchase orders in the system.
 * The routes handle CRUD operations and status updates for purchase orders.
 */

/**
 * GET /api/purchase-orders/:id
 * Purpose: Retrieves a specific purchase order by its ID
 * Flow:
 * 1. Receives purchase order ID as URL parameter
 * 2. Queries database to get purchase order details including:
 *    - Basic order info (status, dates, amounts)
 *    - Associated supplier details
 *    - Ordered items list
 *    - User who created the order
 * 3. Returns full purchase order object to frontend
 * Access: Authenticated users
 */

/**
 * PATCH /api/purchase-orders/:id/status
 * Purpose: Updates the status of a specific purchase order
 * Flow:
 * 1. Receives purchase order ID and new status in request
 * 2. Validates status is one of: pending, approved, rejected, draft, sent
 * 3. Updates status in database
 * 4. If status = approved:
 *    - Fetches complete order details
 *    - Generates PDF document
 *    - Sends email to supplier with PO attached
 * 5. Returns updated purchase order
 * Access: Admin users only
 * Related Files:
 * - pdfGenerator.js: Generates PO PDF
 * - emailService.js: Handles email sending
 */

// Route implementations follow below...
router.patch('/purchase-orders/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, comments } = req.body;
        console.log('status',status);
        // Validate the status
        if (!['pending', 'approved', 'rejected', 'draft', 'sent'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        
        // Update the purchase order status
        const updateQuery = `
            UPDATE purchase_orders
            SET 
                status = $1,
                notes = CASE
                    WHEN $2::TEXT IS NOT NULL AND $2::TEXT != ''
                    THEN COALESCE(notes, '') || E'\n' || $2::TEXT
                    ELSE notes
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `;
        
        const result = await pool.query(updateQuery, [status, comments, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }
        
        const updatedOrder = result.rows[0];
        
        // If the status is approved, send email to vendor
        if (status === 'approved') {
            try {
                // Get the full purchase order details with items
                const fullOrderQuery = `
                    SELECT po.*, 
                        u.username as ordered_by_name,
                        s.name as supplier_name,
                        s.email as supplier_email
                    FROM purchase_orders po
                    LEFT JOIN users u ON po.ordered_by = u.id
                    LEFT JOIN suppliers s ON po.supplier_id = s.id
                    WHERE po.id = $1
                `;
                
                const fullOrderResult = await pool.query(fullOrderQuery, [id]);
                const fullOrder = fullOrderResult.rows[0];
                
                // Fetch the items for this purchase order
                const itemsQuery = `
                    SELECT * FROM order_items 
                    WHERE order_id = $1
                `;
                const itemsResult = await pool.query(itemsQuery, [id]);
                fullOrder.items = itemsResult.rows;
                
                // Check if we have the vendor email
                const vendorEmail = fullOrder.supplier_email || req.body.vendorEmail;
                
                if (vendorEmail) {
                    // Import email service
                    const { sendPurchaseOrderEmail } = require('../utils/emailService');
                    
                    // Prepare email data
                    const emailData = {
                        to: vendorEmail,
                        subject: `Purchase Order ${fullOrder.order_number} Approved`,
                        message: `
                            <p>Dear ${fullOrder.supplier_name || 'Vendor'},</p>
                            <p>We are pleased to inform you that Purchase Order ${fullOrder.order_number} has been approved.</p>
                            <p>Order Details:</p>
                            <ul>
                                <li>PO Number: ${fullOrder.order_number}</li>
                                <li>Date: ${new Date(fullOrder.order_date || fullOrder.created_at).toLocaleDateString()}</li>
                                <li>Total Amount: $${parseFloat(fullOrder.total_amount || 0).toFixed(2)}</li>
                                <li>Status: Approved</li>
                            </ul>
                            <p>Please process this order as soon as possible.</p>
                            <p>Thank you for your partnership.</p>
                            <p>Best regards,<br>${req.body.username || 'Admin'}</p>
                        `
                    };
                    
                    // Send the email
                    await sendPurchaseOrderEmail(id, emailData);
                    
                    console.log(`Approval email sent to vendor ${vendorEmail} for PO ${fullOrder.order_number}`);
                } else {
                    console.warn(`Could not send approval email for PO ${fullOrder.order_number}: No vendor email found`);
                }
            } catch (emailError) {
                console.error('Error sending approval email to vendor:', emailError);
                // Don't stop the approval process if email fails
            }
        }
        
        // Emit socket event for status change notification
        socketIO.getIO().emit('po_status_update', {
            poId: updatedOrder.id,
            poNumber: updatedOrder.order_number,
            status: updatedOrder.status,
            updatedBy: req.body.username || 'Admin', // Use authenticated user info
            comments: comments
        });
        
        res.status(200).json({
            message: `Purchase order ${status} successfully`,
            purchaseOrder: updatedOrder
        });
    } catch (error) {
        console.error('Error updating purchase order status:', error);
        res.status(500).json({ message: 'Error updating purchase order status', error: error.message });
    }
});

// Send email route - This route handles sending purchase order emails to vendors
// It validates the PO is approved, gets all PO details including items,
// generates a PDF attachment if requested, and sends the email to the vendor
router.post('/:id/send-email', async (req, res) => {
  const { id } = req.params;
  const { includeAttachment } = req.body;
  
  console.log('\n🚀 Starting email process for PO ID:', id);
  
  try {
    // 1. Get PO Details with all related data
    console.log('\n📥 Step 1: Fetching PO details...');
    const poQuery = `
      SELECT po.*, 
             u.username as ordered_by_name,
             s.name as supplier_name,
             s.email as supplier_email
      FROM purchase_orders po
      LEFT JOIN users u ON po.ordered_by = u.id
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.id = $1
    `;
    
    const poResult = await pool.query(poQuery, [id]);
    if (!poResult.rows.length) {
      console.log('❌ PO not found with ID:', id);
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    
    const po = poResult.rows[0];
    console.log('✅ Found PO:', po.order_number);

    // 2. Get PO Items
    console.log('\n📦 Step 2: Fetching PO items...');
    const itemsQuery = `SELECT * FROM order_items WHERE order_id = $1`;
    const itemsResult = await pool.query(itemsQuery, [id]);
    po.items = itemsResult.rows;
    console.log(`✅ Found ${po.items.length} items`);

    // 3. Validate PO is approved and has vendor email
    console.log('\n✔️ Step 3: Validating PO status and email...');
    if (po.status !== 'approved') {
      console.log('❌ PO not approved. Current status:', po.status);
      return res.status(400).json({ message: 'Cannot send email for non-approved purchase orders' });
    }

    const vendorEmail = po.supplier_email || po.vendor_email;
    if (!vendorEmail) {
      console.log('❌ No vendor email found for PO');
      return res.status(400).json({ message: 'No vendor email found' });
    }
    console.log('✅ Vendor email found:', vendorEmail);

    // 4. Generate PDF and send email
    console.log('\n📄 Step 4: Generating PDF and sending email...');
    try {
      // Always generate PDF for approved POs
      const pdfBuffer = await pdfGeneratorGenerate(po);
      console.log('✅ PDF generated:', pdfBuffer ? `${pdfBuffer.length} bytes` : 'No buffer');

      if (!Buffer.isBuffer(pdfBuffer)) {
        throw new Error('Invalid PDF buffer received from generator');
      }

      // Send email with PDF
      const emailResult = await sendPurchaseOrderEmail(po, vendorEmail, pdfBuffer);
      console.log('📧 Email result:', emailResult);

      if (!emailResult.sent) {
        throw new Error(emailResult.error?.message || 'Failed to send email');
      }

      // 5. Update email sent indicator
      await pool.query(
        `UPDATE purchase_orders 
         SET email_sent = true,
            last_email_sent = NOW(),
            email_sent_count = COALESCE(email_sent_count, 0) + 1
         WHERE id = $1`,
        [id]
      );

      // 6. Send success response
      return res.json({
        success: true,
        message: `Email sent to ${vendorEmail} for PO ${po.order_number}`
      });

    } catch (error) {
      console.error('❌ Error in PDF/Email process:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate PDF or send email'
      });
    }

  } catch (error) {
    console.error('❌ Error in email process:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory:', uploadsDir);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept PDF files and common document formats
  const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and document files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: fileFilter
})

// Routes
// Get all purchase orders


// Get all purchase orders
// Get a specific purchase order by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
      const { id } = req.params;
      
      const query = `
          SELECT po.*, 
                 u.username as ordered_by_name,
                 s.name as supplier_name
          FROM purchase_orders po
          LEFT JOIN users u ON po.ordered_by = u.id
          LEFT JOIN suppliers s ON po.supplier_id = s.id
          WHERE po.id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Purchase order not found' });
      }
      
      const purchaseOrder = result.rows[0];
      
      // Fetch the items for this purchase order
      const itemsQuery = `
          SELECT * FROM order_items 
          WHERE order_id = $1
      `;
      const itemsResult = await pool.query(itemsQuery, [id]);
      purchaseOrder.items = itemsResult.rows;
      
      res.status(200).json(purchaseOrder);
  } catch (error) {
      console.error('Error fetching purchase order:', error);
      res.status(500).json({ message: 'Error fetching purchase order', error: error.message });
  }
});

// Get pending purchase orders (admin only)
router.get('/pending', async (req, res) => {
    console.log('Fetching pending purchase ordersssssss');
    try {
        const query = `
            SELECT po.*, 
                   u.username as ordered_by_name,
                   s.name as supplier_name,
                   s.email as supplier_email
            FROM purchase_orders po
            LEFT JOIN users u ON po.ordered_by = u.id
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            WHERE po.status = 'pending'
            ORDER BY po.created_at DESC
        `;
        
        const result = await pool.query(query);
        const pendingOrders = result.rows;
        
        // For each pending order, fetch its items
        for (const order of pendingOrders) {
            const itemsQuery = `
                SELECT * FROM order_items 
                WHERE order_id = $1
            `;
            const itemsResult = await pool.query(itemsQuery, [order.id]);
            order.items = itemsResult.rows;
        }
        
        res.status(200).json(pendingOrders);
    } catch (error) {
        console.error('Error fetching pending purchase orders:', error);
        res.status(500).json({ message: 'Error fetching pending purchase orders', error: error.message });
    }
});

// Add this function at the top of your file, after imports
const generateUniqueOrderNumber = async (client, maxAttempts = 10) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate a new order number
    const prefix = 'PO';
    const year = new Date().getFullYear();
    const randomNum1 = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const randomNum2 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const orderNumber = `${prefix}-${year}-${randomNum1}-${randomNum2}`;
    
    // Check if this order number already exists
    const checkQuery = 'SELECT EXISTS(SELECT 1 FROM purchase_orders WHERE order_number = $1)';
    const result = await client.query(checkQuery, [orderNumber]);
    
    if (!result.rows[0].exists) {
      console.log(`Generated unique order number: ${orderNumber} (attempt ${attempt + 1})`);
      return orderNumber;
    }
    
    console.log(`Order number ${orderNumber} already exists, trying again (attempt ${attempt + 1})`);
  }
  
  throw new Error(`Failed to generate unique order number after ${maxAttempts} attempts`);
};

// Then modify your POST route
router.post('/', async (req, res) => {
  // FIXED: Ensure supplier_id, vendor, and item descriptions are handled
  const client = await pool.connect();
  try {
    const {
      order_number,
      supplier_id,
      ordered_by,
      order_date,
      expected_delivery,
      status = 'draft',
      total_amount,
      notes,
      vendor = {},
      vendor_name,
      vendor_email,
      contact_person,
      phone_number,
      site_id,
      items = [],
      ...rest
    } = req.body;

    let finalVendorName = vendor_name || vendor.name || '';
    let finalVendorEmail = vendor_email || vendor.email || '';
    let finalContactPerson = contact_person || vendor.contactPerson || '';
    let finalPhoneNumber = phone_number || vendor.phone || '';
    let finalSupplierId = supplier_id || vendor.id || null;

    // If supplier_id is provided, fetch supplier details for snapshot
    if (finalSupplierId) {
      const supplierResult = await pool.query(
        'SELECT name, email, phone, contact_person, address FROM suppliers WHERE id = $1',
        [finalSupplierId]
      );
      if (supplierResult.rows.length > 0) {
        const s = supplierResult.rows[0];
        if (!finalVendorName) finalVendorName = s.name;
        if (!finalVendorEmail) finalVendorEmail = s.email;
        if (!finalContactPerson) finalContactPerson = s.contact_person;
        if (!finalPhoneNumber) finalPhoneNumber = s.phone;
        // If you have a vendor_address column, set it here
        // if (!vendor_address) vendor_address = s.address;
      }
    }

    // Insert PO (add more fields as needed)
    const insertPOQuery = `
      INSERT INTO purchase_orders (
        order_number, supplier_id, ordered_by, order_date, expected_delivery, status, total_amount, notes,
        vendor_name, vendor_email, contact_person, phone_number, site_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `;
    const insertPOValues = [
      order_number, finalSupplierId, ordered_by, order_date, expected_delivery, status, total_amount, notes,
      finalVendorName, finalVendorEmail, finalContactPerson, finalPhoneNumber, site_id
    ];
    const poResult = await pool.query(insertPOQuery, insertPOValues);
    const po = poResult.rows[0];

    // Insert items (ensure description is present)
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        await pool.query(
          'INSERT INTO order_items (order_id, name, quantity, unit_price, description, product_link) VALUES ($1,$2,$3,$4,$5,$6)',
          [po.id, item.name, item.quantity, item.unit_price, item.description || '', item.productLink || null]
        );
      }
    }

    res.status(201).json(po);
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ message: 'Failed to create purchase order', error: error.message });
  } finally {
    client.release();
  }
});

// Add a new route to get the PDF for a purchase order
router.get('/:id/pdf', async (req, res) => {
    try {
        // FIXED: Use correct column name 'order_number' instead of 'po_number'
        const result = await pool.query(
            'SELECT pdf_path, order_number FROM purchase_orders WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0 || !result.rows[0].pdf_path) {
            return res.status(404).json({ error: 'PDF not found' });
        }

        const { pdf_path, order_number } = result.rows[0];
        
        // Set appropriate headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=PO-${order_number}.pdf`);
        res.setHeader('Content-Length', pdf_path.length);
        
        // Send the PDF data
        res.send(pdf_path);
    } catch (error) {
        console.error('Error retrieving PDF:', error);
        res.status(500).json({ error: 'Failed to retrieve PDF' });
    }
});

// Delete a purchase order (soft delete or hard delete)
router.delete('/purchase-orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if we should implement soft delete instead
        // For now, this is a hard delete that removes the order and its items
        
        // Start a transaction
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Delete associated order items first (foreign key constraint)
            await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);
            
            // Delete the purchase order
            const deleteQuery = `DELETE FROM purchase_orders WHERE id = $1 RETURNING *`;
            const result = await client.query(deleteQuery, [id]);
            
            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Purchase order not found' });
            }
            
            await client.query('COMMIT');
            
            res.status(200).json({
                message: 'Purchase order deleted successfully',
                purchaseOrder: result.rows[0]
            });
            
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error deleting purchase order:', error);
        res.status(500).json({ message: 'Error deleting purchase order', error: error.message });
    }
});

// Diagnostic endpoint to check database schema
router.get('/check-schema', async (req, res) => {
    try {
        console.log('Checking database schema');
        
        const client = await pool.connect();
        try {
            // Check if purchase_orders table exists
            const purchaseOrdersTable = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'purchase_orders'
                );
            `);
            
            // Check if order_items table exists
            const orderItemsTable = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'order_items'
                );
            `);
            
            // Get purchase_orders columns
            let purchaseOrdersColumns = [];
            if (purchaseOrdersTable.rows[0].exists) {
                const poColumnsResult = await client.query(`
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_name = 'purchase_orders'
                    ORDER BY ordinal_position;
                `);
                purchaseOrdersColumns = poColumnsResult.rows;
            }
            
            // Get order_items columns
            let orderItemsColumns = [];
            if (orderItemsTable.rows[0].exists) {
                const itemsColumnsResult = await client.query(`
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_name = 'order_items'
                    ORDER BY ordinal_position;
                `);
                orderItemsColumns = itemsColumnsResult.rows;
            }
            
            // Send schema information
            res.json({
                purchaseOrdersTableExists: purchaseOrdersTable.rows[0].exists,
                orderItemsTableExists: orderItemsTable.rows[0].exists,
                purchaseOrdersColumns,
                orderItemsColumns,
                checkTimestamp: new Date().toISOString()
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error checking schema:', error);
        res.status(500).json({
            message: 'Error checking database schema',
            error: error.message
        });
    }
});

// Add route to send PO email with PDF
router.post('/send-email', async (req, res) => {
    try {
        console.log('\n📧 PURCHASE ORDER EMAIL REQUEST 📧');
        console.log('----------------------------------');
        const { to, subject, message, poId } = req.body;
        const pdfFile = req.file;

        console.log('Email request details:');
        console.log(`To: ${to || 'Not provided'}`);
        console.log(`Subject: ${subject || 'Not provided'}`);
        console.log(`PO ID: ${poId || 'Not provided'}`);
        console.log(`File received: ${pdfFile ? 'Yes' : 'No'}`);
        if (pdfFile) {
            console.log(`File name: ${pdfFile.originalname}`);
            console.log(`File size: ${pdfFile.size} bytes`);
            console.log(`File path: ${pdfFile.path}`);
        }
        console.log('----------------------------------');

        if (!pdfFile) {
            console.error('Missing PDF file in request');
            return res.status(400).json({ 
                success: false,
                error: 'PDF file is required' 
            });
        }

        if (!to || !subject || !message) {
            console.error('Missing required email fields');
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: to, subject, or message'
            });
        }

        // Import mock email service for development
        const { sendPurchaseOrderWithPdf } = require('../controllers/mock-email.controller');

        console.log('🔄 Routing to mock email controller');
        // Send email with PDF attachment using the mock controller
        await sendPurchaseOrderWithPdf(req, res);
        
        // Note: The controller handles the response
    } catch (error) {
        console.error('Error sending PO email:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to send email',
            message: error.message 
        });
    }
});

// Add this route to your purchase-order.routes.js file
router.get('/search', async (req, res) => {
  try {
    const { term } = req.query;
    
    if (!term || term.length < 3) {
      return res.status(400).json({ error: 'Search term must be at least 3 characters' });
    }
    
    const query = `
      SELECT 
        po.id,
        po.order_number,
        po.created_at,
        po.total_amount,
        s.name AS supplier_name,
        po.vendor_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE 
        po.order_number ILIKE $1 OR
        s.name ILIKE $1 OR
        po.vendor_name ILIKE $1
      ORDER BY po.created_at DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query, [`%${term}%`]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching purchase orders:', error);
    res.status(500).json({ error: 'Failed to search purchase orders', details: error.message });
  }
});

// Helper functions
function extractOrderDetailsFromEmail(emailBody) {
  // Implementation to parse email body for order details
  // This is a simplified version - you'll need to adapt to your specific email formats
  const orderDetails = {
    orderNumber: extractRegexMatch(emailBody, /order\s*#?\s*:?\s*(\w+-\d+)/i) || '',
    vendor: extractRegexMatch(emailBody, /vendor\s*:?\s*([A-Za-z]+)/i) || '',
    items: []
  };
  
  // Extract items (this is simplified, adapt to your email format)
  const itemMatches = emailBody.match(/(\d+)\s*x\s*([A-Za-z0-9 ]+)\s*-\s*([A-Za-z]+)/g) || [];
  orderDetails.items = itemMatches.map(item => {
    const parts = item.match(/(\d+)\s*x\s*([A-Za-z0-9 ]+)\s*-\s*([A-Za-z]+)/);
    return {
      name: parts[2].trim(),
      quantity: parseInt(parts[1], 10),
      type: parts[3].trim()
    };
  });
  
  return orderDetails;
}

function extractVendorFromEmail(sender) {
  // Simple logic to extract vendor name from email address
  const vendorDomains = {
    'dell.com': 'Dell',
    'hp.com': 'HP',
    // Add other vendors as needed
  };
  
  for (const [domain, vendor] of Object.entries(vendorDomains)) {
    if (sender.includes(domain)) return vendor;
  }
  
  return 'Unknown Vendor';
}

function extractRegexMatch(text, regex) {
  const match = text.match(regex);
  return match ? match[1] : null;
}

async function checkEmailsForUpdates() {
  console.log('Checking for email updates on existing orders...');
  try {
    // Get the email service (replace with your actual email checking service)
    const emailCheckScheduler = require('../services/emailCheckScheduler');
    
    // Request manual check of emails
    const emails = await emailCheckScheduler.checkEmailsNow();
    console.log(`Found ${emails.length} emails to process`);
    
    const updatedOrders = [];
    
    // Process each email
    for (const email of emails) {
      // Check if this email contains tracking updates for any existing orders
      const orderNumberMatches = email.body.match(/order\s*#?\s*:?\s*(\w+-\d+)/i);
      const trackingNumberMatches = email.body.match(/tracking\s*#?\s*:?\s*([A-Za-z0-9-]+)/i);
      
      if (orderNumberMatches && trackingNumberMatches) {
        const orderNumber = orderNumberMatches[1];
        const trackingNumber = trackingNumberMatches[1];
        
        // Check if this order exists
        const orderQuery = `
          SELECT * FROM purchase_orders 
          WHERE order_number = $1
        `;
        
        const orderResult = await pool.query(orderQuery, [orderNumber]);
        
        if (orderResult.rows.length > 0) {
          const order = orderResult.rows[0];
          
          // Update the tracking information
          const updateQuery = `
            UPDATE purchase_orders
            SET 
              tracking_number = $1,
              shipping_status = 'In Transit',
              last_status_update = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
          `;
          
          const updateResult = await pool.query(updateQuery, [trackingNumber, order.id]);
          const updatedOrder = updateResult.rows[0];
          
          console.log(`Updated tracking for order ${orderNumber}: ${trackingNumber}`);
          updatedOrders.push(updatedOrder);
        } else {
          console.log(`Received tracking update for unknown order: ${orderNumber}`);
        }
      }
    }
    
    return updatedOrders;
  } catch (error) {
    console.error('Error checking emails for updates:', error);
    return [];
  }
}

module.exports = router; 