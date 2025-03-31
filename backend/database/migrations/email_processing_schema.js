const { pool } = require('../schema');

async function createEmailProcessingTables() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create invoices table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        po_id INTEGER REFERENCES purchase_orders(id),
        invoice_number VARCHAR(100),
        invoice_date DATE,
        invoice_amount DECIMAL(12,2),
        file_path TEXT,
        file_name VARCHAR(255),
        content_type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'received',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create email processing log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_processing_log (
        id SERIAL PRIMARY KEY,
        po_id INTEGER REFERENCES purchase_orders(id),
        email_id VARCHAR(255),
        sender VARCHAR(255),
        subject TEXT,
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status_updates JSONB,
        has_attachments BOOLEAN DEFAULT FALSE,
        attachment_count INTEGER DEFAULT 0
      )
    `);
    
    // Add new columns to purchase_orders table if they don't exist
    const columnsToAdd = [
      { name: 'shipping_status', type: 'VARCHAR(50)' },
      { name: 'tracking_number', type: 'VARCHAR(100)' },
      { name: 'current_location', type: 'VARCHAR(255)' },
      { name: 'estimated_delivery', type: 'DATE' },
      { name: 'has_invoice', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'invoice_received_date', type: 'TIMESTAMP' },
      { name: 'last_status_update', type: 'TIMESTAMP' },
      { name: 'status_notes', type: 'TEXT' }
    ];
    
    for (const column of columnsToAdd) {
      // Check if column exists
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'purchase_orders' AND column_name = $1
      `, [column.name]);
      
      if (columnCheck.rows.length === 0) {
        // Column doesn't exist, add it
        await client.query(`
          ALTER TABLE purchase_orders 
          ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}
        `);
        console.log(`Added column ${column.name} to purchase_orders table`);
      }
    }
    
    // Create index on order_number for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_number 
      ON purchase_orders(order_number)
    `);
    
    await client.query('COMMIT');
    console.log('Email processing schema setup complete');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting up email processing schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { createEmailProcessingTables }; 