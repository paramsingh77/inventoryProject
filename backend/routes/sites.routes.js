const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const { pool } = require('../config/db.config');
const { 
  executeQuery, 
  executeSiteTableQuery, 
  executeMultiSiteQuery 
} = require('../utils/dbUtils');

// Get all sites (protected route)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const sitesQuery = `
      SELECT id, name, location, image_url, is_active
      FROM sites
      ORDER BY name ASC
    `;
    
    const result = await pool.query(sitesQuery);
    
    res.json({
      success: true,
      sites: result.rows
    });
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/sites
router.get('/sites', async (req, res) => {
    try {
    const result = await executeQuery(
      'SELECT * FROM sites ORDER BY name ASC',
      [],
      { source: 'sites-list' }
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get devices for a specific site
router.get('/sites/:siteName/devices', async (req, res) => {
  try {
    const { siteName } = req.params;
    const { status, type, limit, offset } = req.query;
    
    // Build options object
    const options = {
      where: {},
      limit: limit ? parseInt(limit) : null,
      offset: offset ? parseInt(offset) : null
    };
    
    if (status) options.where.status = status;
    if (type) options.where.device_type = type;
    
    const result = await executeSiteTableQuery(
      siteName,
      'device_inventory',
      'SELECT',
      options
    );
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get orders across all sites
router.get('/orders', async (req, res) => {
  try {
    // First get all site names
    const sitesResult = await executeQuery(
      'SELECT name FROM sites',
      [],
      { source: 'all-sites', logResults: false }
    );
    
    const siteNames = sitesResult.rows.map(row => row.name);
    
    // Query orders across all sites
    const options = {
      fields: ['id', 'order_number', 'vendor_name', 'status', 'total_amount', 'order_date'],
      order: ['order_date', 'DESC'],
      limit: req.query.limit ? parseInt(req.query.limit) : null
    };
    
    // If status filter is provided
    if (req.query.status) {
      options.where.status = req.query.status;
    }
    
    const result = await executeMultiSiteQuery(
      siteNames,
      'purchase_orders',
      'SELECT',
      options
    );
    
    // Handle any errors
    if (result.errors.length > 0) {
      console.warn('Some site queries failed:', result.errors);
    }
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add route for creating a site-specific order
router.post('/:siteName/orders', async (req, res) => {
  console.log('Creating site-specific order for:', req.params.siteName);
  console.log('Request body:', req.body);
  const client = await pool.connect();
  
  try {
    const { siteName } = req.params;
    const orderData = req.body;
    
    // Get site_id from site name
    const siteResult = await client.query(
      'SELECT id FROM sites WHERE name = $1',
      [siteName]
    );
    
    if (siteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    const siteId = siteResult.rows[0].id;
    
    // Start transaction
    await client.query('BEGIN');
    
    // Insert order with site_id
    const result = await client.query(
      `INSERT INTO purchase_orders (
        order_number, supplier_id, vendor_name, vendor_email, total_amount, 
        status, site_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        orderData.poNumber, 
        orderData.supplierId || null, 
        orderData.vendor?.name || orderData.vendorName, 
        orderData.vendor?.email || orderData.vendorEmail, 
        orderData.totalAmount || 0,
        orderData.status || 'pending',
        siteId
      ]
    );
    
    // If order has items, check the order_items table structure before inserting
    if (orderData.items && orderData.items.length > 0) {
      // First check what columns actually exist in the order_items table
      const columnsCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'order_items'
      `);
      
      const columnNames = columnsCheck.rows.map(row => row.column_name);
      console.log('Order items columns:', columnNames);
      
      // Determine the correct column names based on what exists
      let nameColumn = 'name'; // Default
      if (columnNames.includes('name')) {
        nameColumn = 'name';
      } else if (columnNames.includes('product_name')) {
        nameColumn = 'product_name';
      } else if (columnNames.includes('item_name')) {
        nameColumn = 'item_name'; 
      }
      
      // Similarly determine other column names
      let priceColumn = columnNames.includes('unit_price') ? 'unit_price' : 'price';
      
      for (const item of orderData.items) {
        // Build a dynamic query based on available columns
        let columns = ['order_id'];
        let placeholders = ['$1'];
        let values = [result.rows[0].id];
        let paramIndex = 2;
        
        // Add name column if it exists
        if (columnNames.includes(nameColumn)) {
          columns.push(nameColumn);
          placeholders.push(`$${paramIndex}`);
          values.push(item.name);
          paramIndex++;
        }
        
        // Add quantity column if it exists
        if (columnNames.includes('quantity')) {
          columns.push('quantity');
          placeholders.push(`$${paramIndex}`);
          values.push(item.quantity);
          paramIndex++;
        }
        
        // Add price column if it exists
        if (columnNames.includes(priceColumn)) {
          columns.push(priceColumn);
          placeholders.push(`$${paramIndex}`);
          values.push(item.unit_price || item.price || 0);
          paramIndex++;
        }
        
        // Add description column if it exists
        if (columnNames.includes('description')) {
          columns.push('description');
          placeholders.push(`$${paramIndex}`);
          values.push(item.description || '');
          paramIndex++;
        }
        
        // Build and execute the query
        const insertQuery = `
          INSERT INTO order_items (${columns.join(', ')})
          VALUES (${placeholders.join(', ')})
        `;
        
        console.log('Inserting item with query:', insertQuery);
        console.log('Values:', values);
        
        await client.query(insertQuery, values);
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    
    console.error('Error creating order:', error);
    res.status(500).json({ 
      error: 'Failed to create order', 
      message: error.message 
    });
  } finally {
    client.release();
  }
});

// Update order status for a specific site
router.patch('/sites/:siteName/orders/:orderId/status', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { siteName, orderId } = req.params;
    const { status } = req.body;
    
    // Verify site
    const siteResult = await client.query(
      'SELECT id FROM sites WHERE name = $1',
      [siteName]
    );
    
    if (siteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    const siteId = siteResult.rows[0].id;
    
    // Update order status only if it belongs to the site
    const result = await client.query(
      `UPDATE purchase_orders 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND site_id = $3
       RETURNING *`,
      [status, orderId, siteId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Order not found or does not belong to this site' 
      });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      error: 'Failed to update order status', 
      message: error.message 
    });
  } finally {
    client.release();
  }
});

// Delete order for a specific site
router.delete('/:siteName/orders/:orderId', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { siteName, orderId } = req.params;
    
    // Verify site
    const siteResult = await client.query(
      'SELECT id FROM sites WHERE name = $1',
      [siteName]
    );
    
    if (siteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    const siteId = siteResult.rows[0].id;
    
    // Delete order only if it belongs to the site
    const result = await client.query(
      `DELETE FROM purchase_orders 
       WHERE id = $1 AND site_id = $2
       RETURNING id`,
      [orderId, siteId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Order not found or does not belong to this site' 
      });
    }
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ 
      error: 'Failed to delete order', 
      message: error.message 
    });
  } finally {
    client.release();
  }
});

// Get orders for a specific site
router.get('/:siteName/orders', async (req, res) => {
  console.log('=== SITE ORDERS ROUTE HIT ===');
  console.log('Request URL:', req.originalUrl);
  console.log('Site name parameter:', req.params.siteName);
  
  const client = await pool.connect();
  
  try {
    const { siteName } = req.params;
    console.log(`Fetching orders for site: ${siteName}`);
    
    // Get site_id from site name
    const siteResult = await client.query(
      'SELECT id FROM sites WHERE name = $1',
      [siteName]
    );
    
    if (siteResult.rows.length === 0) {
      console.log(`Site not found: ${siteName}`);
      return res.status(404).json({ 
        error: 'Site not found',
        message: `No site found with name: ${siteName}`
      });
    }
    
    const siteId = siteResult.rows[0].id;
    console.log(`Found site ID: ${siteId}`);
    
    // Check if order_items table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'order_items'
      );
    `);
    
    const orderItemsExists = tableCheck.rows[0].exists;
    console.log('Order items table exists:', orderItemsExists);
    
    // Basic query without the problematic subquery
    const result = await client.query(
      `SELECT 
        po.id, 
        po.order_number, 
        po.vendor_name, 
        po.vendor_email,
        po.total_amount, 
        po.status, 
        po.site_id,
        s.name as site_name,
        po.created_at, 
        po.updated_at,
        po.notes,
        po.has_invoice,
        po.invoice_received_date,
        po.shipping_status,
        po.tracking_number,
        po.expected_delivery,
        po.actual_delivery
      FROM purchase_orders po
      LEFT JOIN sites s ON po.site_id = s.id
      WHERE po.site_id = $1
      ORDER BY po.created_at DESC`,
      [siteId]
    );
    
    console.log(`Found ${result.rows.length} orders for site ${siteName}`);
    
    if (result.rows.length === 0) {
      return res.json([]);  // Return empty array if no orders found
    }
    
    // If order_items table exists, try to fetch items separately
    let ordersWithItems = result.rows;
    
    if (orderItemsExists) {
      // Check what columns exist in the order_items table
      const columnsCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'order_items'
      `);
      
      const columns = columnsCheck.rows.map(row => row.column_name);
      console.log('Order items columns:', columns);
      
      // Only try to fetch items if the table has the required columns
      if (columns.includes('order_id')) {
        for (let i = 0; i < ordersWithItems.length; i++) {
          try {
            const itemsQuery = `
              SELECT * 
              FROM order_items 
              WHERE order_id = $1
            `;
            
            const itemsResult = await client.query(itemsQuery, [ordersWithItems[i].id]);
            ordersWithItems[i].items = itemsResult.rows || [];
          } catch (err) {
            console.error(`Error fetching items for order ${ordersWithItems[i].id}:`, err.message);
            ordersWithItems[i].items = [];
          }
        }
      } else {
        // Add empty items array to each order
        ordersWithItems = ordersWithItems.map(order => ({
          ...order,
          items: []
        }));
      }
    } else {
      // Add empty items array to each order
      ordersWithItems = ordersWithItems.map(order => ({
        ...order,
        items: []
      }));
    }
    
    res.json(ordersWithItems);
    } catch (error) {
    console.error('Error fetching site orders:', error);
        res.status(500).json({ 
      error: 'Failed to fetch orders', 
      message: error.message 
    });
  } finally {
    client.release();
  }
});

// Get inventory for a specific site
router.get('/:siteName/inventory', async (req, res) => {
  console.log('=== SITE INVENTORY ROUTE HIT ===');
  console.log('Request URL:', req.originalUrl);
  console.log('Site name parameter:', req.params.siteName);
  
  const client = await pool.connect();
  
  try {
    const { siteName } = req.params;
    console.log(`Fetching inventory for site: ${siteName}`);
    
    // Get site_id from site name
    const siteResult = await client.query(
      'SELECT id FROM sites WHERE name = $1',
      [siteName]
    );
    
    if (siteResult.rows.length === 0) {
      console.log(`Site not found: ${siteName}`);
      return res.status(404).json({ 
        error: 'Site not found',
        message: `No site found with name: ${siteName}`
      });
    }
    
    const siteId = siteResult.rows[0].id;
    console.log(`Found site ID: ${siteId}`);
    
    // Check if we have a site-specific inventory table
    const formattedSiteName = siteName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const tableName = `${formattedSiteName}_device_inventory`;
    
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      );
    `, [tableName]);
    
    const specificTableExists = tableCheck.rows[0].exists;
    console.log(`Site-specific inventory table exists: ${specificTableExists}`);
    
    let inventoryQuery;
    let queryParams;
    
    if (specificTableExists) {
      // Use site-specific table
      inventoryQuery = `SELECT * FROM ${tableName} ORDER BY last_seen DESC`;
      queryParams = [];
    } else {
      // Fall back to general inventory with site filter
      inventoryQuery = `
        SELECT * FROM device_inventory 
        WHERE site_id = $1 OR location = $2
        ORDER BY last_seen DESC
      `;
      queryParams = [siteId, siteName];
    }
    
    const result = await client.query(inventoryQuery, queryParams);
    console.log(`Found ${result.rows.length} inventory items for site ${siteName}`);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching site inventory:', error);
    res.status(500).json({ 
      error: 'Failed to fetch inventory', 
      message: error.message 
    });
  } finally {
    client.release();
  }
});

// Add this at the top of your routes
router.get('/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'Sites routes are working' });
});

module.exports = router; 