const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { pool } = require('../database/schema');
const authMiddleware = require('../middleware/auth');
const { format } = require('pg');

/**
 * @route GET /api/sites
 * @desc Get all sites
 * @access Private
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching all sites');
    
    // Query that works with your existing database structure
    const query = `
      SELECT DISTINCT 
        location as name,
        location as id,
        'true' as is_active
      FROM 
        device_inventory
      WHERE 
        location IS NOT NULL AND location != ''
      ORDER BY 
        location
    `;
    
    const result = await pool.query(query);
    console.log(`Found ${result.rows.length} sites`);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
});

// Get all sites
router.get('/sites', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT id, name, location, image_url, is_active, created_at
      FROM sites 
      ORDER BY name ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single site
router.get('/sites/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT id, name, location, image_url, is_active, created_at
      FROM sites 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Site not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching site:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update site status
router.patch('/sites/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    const query = `
      UPDATE sites 
      SET is_active = $1 
      WHERE id = $2 
      RETURNING *
    `;
    
    const result = await pool.query(query, [is_active, id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating site status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { siteId } = req.params;
    const dir = `backend/sitesData/${siteId}`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Preserve original filename for data type identification
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// Add support for multiple file uploads
router.post('/sites/:siteId/import', upload.array('files', 10), async (req, res) => {
  const { siteId } = req.params;
  const files = req.files;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const file of files) {
      // Determine data type from filename
      const dataType = getDataTypeFromFilename(file.originalname);
      
      // Record import attempt
      const importRecord = await client.query(
        `INSERT INTO site_data_imports (site_id, file_name, import_type, status)
         VALUES ($1, $2, $3, 'processing')
         RETURNING id`,
        [siteId, file.originalname, dataType]
      );

      const importId = importRecord.rows[0].id;
      const results = [];
      let errorLog = [];

      // Process file based on data type
      await processFile(file.path, dataType, client, siteId, results, errorLog);

      // Update import record
      await client.query(
        `UPDATE site_data_imports 
         SET status = $1, imported_rows = $2, error_log = $3, completed_at = NOW()
         WHERE id = $4`,
        [
          errorLog.length === 0 ? 'completed' : 'completed_with_errors',
          results.length,
          errorLog.join('\n'),
          importId
        ]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'All files processed successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing files:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Helper function to determine data type from filename
function getDataTypeFromFilename(filename) {
  const lowerFilename = filename.toLowerCase();
  if (lowerFilename.includes('inventory')) return 'inventory';
  if (lowerFilename.includes('supplier')) return 'suppliers';
  if (lowerFilename.includes('purchase') || lowerFilename.includes('order')) return 'purchase_orders';
  return 'unknown';
}

// Process file function
async function processFile(filePath, dataType, client, siteId, results, errorLog) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', async () => {
        try {
          // Process in batches for large files
          const batchSize = 1000;
          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            await processBatch(batch, dataType, client, siteId, results, errorLog);
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

// Process batch function
async function processBatch(rows, dataType, client, siteId, results, errorLog) {
  for (const row of rows) {
    try {
      switch (dataType) {
        case 'inventory':
          await processInventoryRow(client, row, siteId);
          break;
        case 'suppliers':
          await processSupplierRow(client, row, siteId);
          break;
        case 'purchase_orders':
          await processPurchaseOrderRow(client, row, siteId);
          break;
      }
      results.push(row);
    } catch (error) {
      errorLog.push(`Error processing row: ${JSON.stringify(row)}, Error: ${error.message}`);
    }
  }
}

// Modified processInventoryRow function
async function processInventoryRow(client, row, siteId) {
  // Get site name first
  const siteResult = await client.query(
    'SELECT name FROM sites WHERE id = $1',
    [siteId]
  );
  
  const siteName = siteResult.rows[0].name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');

  // Check if item exists
  const existingItem = await client.query(
    format('SELECT id FROM %I_inventory WHERE item_name = $1', siteName),
    [row.item_name]
  );

  if (existingItem.rows.length > 0) {
    // Update existing item
    await client.query(
      format(`
        UPDATE %I_inventory 
        SET quantity = $1,
            category = $2,
            description = $3,
            unit_price = $4,
            reorder_level = $5,
            updated_at = NOW()
        WHERE id = $6
      `, siteName),
      [
        row.quantity || 0,
        row.category,
        row.description,
        row.unit_price || 0,
        row.reorder_level || 0,
        existingItem.rows[0].id
      ]
    );
  } else {
    // Insert new item
    await client.query(
      format(`
        INSERT INTO %I_inventory 
        (item_name, quantity, category, description, unit_price, reorder_level)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, siteName),
      [
        row.item_name,
        row.quantity || 0,
        row.category,
        row.description,
        row.unit_price || 0,
        row.reorder_level || 0
      ]
    );
  }
}

// Similar modifications for processSupplierRow and processPurchaseOrderRow

// Create tables for a new site
router.post('/sites/:siteId/initialize', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { siteId } = req.params;
    
    // Get site name
    const siteResult = await client.query(
      'SELECT name FROM sites WHERE id = $1',
      [siteId]
    );
    
    if (siteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const siteName = siteResult.rows[0].name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_'); // Sanitize name for table names

    // Create tables for the site
    await client.query('SELECT create_site_tables($1)', [siteName]);

    res.json({ message: `Tables created for site: ${siteName}` });
  } catch (error) {
    console.error('Error initializing site tables:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Get all data for a specific site
router.get('/:siteName/data', async (req, res) => {
  const client = await pool.connect();
  try {
    const { siteName } = req.params;
    // Format the table name correctly - convert spaces to underscores and lowercase
    const formattedSiteName = siteName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const tableName = `${formattedSiteName}_device_inventory`;

    console.log(`Looking for table: ${tableName}`);

    // Verify table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      );
    `, [tableName]);

    if (!tableExists.rows[0].exists) {
      return res.status(404).json({ error: `Site table not found: ${tableName}` });
    }

    // Fetch all devices for the site
    const result = await client.query(`
      SELECT 
        id,
        site_name,
        device_hostname,
        device_description,
        last_user,
        last_seen,
        device_type,
        device_model,
        operating_system,
        serial_number,
        device_cpu,
        mac_addresses,
        status,
        vendor,
        created_at,
        updated_at
      FROM ${tableName}
      ORDER BY device_hostname ASC
    `);

    res.json({
      site: siteName,
      devices: result.rows
    });

  } catch (error) {
    console.error('Error fetching site data:', error);
    res.status(500).json({ error: 'Failed to fetch site data', details: error.message });
  } finally {
    client.release();
  }
});

// Get orders for a specific site
router.get('/:siteName/orders', async (req, res) => {
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
    
    // FIXED: Use correct column name 'order_number' instead of 'po_number'
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
        po.actual_delivery,
        COALESCE(po.email_sent_count, 0) as email_sent_count,
        (
          SELECT json_agg(
            json_build_object(
              'id', oi.id,
              'name', oi.item_name,
              'quantity', oi.quantity,
              'price', oi.unit_price,
              'description', oi.description
            )
          )
          FROM order_items oi
          WHERE oi.order_id = po.id
        ) as items
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
    
    res.json(result.rows);
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
    
    // FIXED: Include both po_number and order_number columns to satisfy database constraints
    const result = await client.query(
      `INSERT INTO purchase_orders (
        po_number, order_number, vendor_name, vendor_email, 
        total_amount, status, site_id, site_name,
        notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      // FIXED: Include both po_number and order_number values to satisfy database constraints
      [
        orderData.poNumber,  // po_number
        orderData.poNumber,  // order_number (same value for both columns)
        orderData.vendor?.name || orderData.vendorName || 'Unknown Vendor', 
        orderData.vendor?.email || orderData.vendorEmail || null, 
        orderData.totalAmount || 0,
        orderData.status || 'pending',
        siteId,
        siteName,
        orderData.notes || ''
      ]
    );
    
    // Commit transaction
    await client.query('COMMIT');
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    
    console.error('Error creating order for site:', error);
    res.status(500).json({ 
      error: 'Failed to create order', 
      message: error.message 
    });
  } finally {
    client.release();
  }
});

// Get site-specific suppliers
router.get('/:siteName/suppliers', async (req, res) => {
  const client = await pool.connect();
  try {
    const { siteName } = req.params;
    const formattedSiteName = siteName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const tableName = `${formattedSiteName}_suppliers`;

    // Check if table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      );
    `, [tableName]);

    if (!tableExists.rows[0].exists) {
      // Return empty array if table doesn't exist
      return res.json([]);
    }

    // Fetch suppliers
    const result = await client.query(`
      SELECT * FROM ${tableName}
      ORDER BY name ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching site suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers', details: error.message });
  } finally {
    client.release();
  }
});

// Get site-specific users
router.get('/:siteName/users', async (req, res) => {
  const client = await pool.connect();
  try {
    const { siteName } = req.params;
    
    // For now, return mock data since we don't have site-specific user tables
    // In a real implementation, you would query a users table with a site filter
    
    const mockUsers = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'Admin',
        last_login: new Date().toISOString(),
        is_active: true
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'Manager',
        last_login: new Date(Date.now() - 86400000).toISOString(),
        is_active: true
      },
      {
        id: 3,
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        role: 'User',
        last_login: new Date(Date.now() - 172800000).toISOString(),
        is_active: false
      }
    ];

    res.json(mockUsers);
  } catch (error) {
    console.error('Error fetching site users:', error);
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  } finally {
    client.release();
  }
});

// Test route to verify the router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Site routes are working' });
});

module.exports = router; 