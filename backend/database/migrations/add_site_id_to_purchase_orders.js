// Migration to add site_id column to purchase_orders table
const { pool } = require('../schema');

async function addSiteIdToPurchaseOrders() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Adding site_id column to purchase_orders table...');
    
    // Check if site_id column already exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'purchase_orders' AND column_name = 'site_id'
    `);
    
    if (columnCheck.rows.length === 0) {
      // Add site_id column
      await client.query(`
        ALTER TABLE purchase_orders 
        ADD COLUMN site_id INTEGER REFERENCES sites(id)
      `);
      
      console.log('Successfully added site_id column to purchase_orders table');
      
      // Add index for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_purchase_orders_site_id 
        ON purchase_orders(site_id)
      `);
      
      console.log('Added index on site_id column');
    } else {
      console.log('site_id column already exists in purchase_orders table');
    }
    
    await client.query('COMMIT');
    console.log('Migration completed successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  addSiteIdToPurchaseOrders()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addSiteIdToPurchaseOrders }; 