// FIXED: Add supplier_id column to purchase_orders table if missing
const { pool } = require('../schema');

async function addSupplierIdToPurchaseOrders() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Check if supplier_id column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'purchase_orders' AND column_name = 'supplier_id'
    `);
    if (columnCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE purchase_orders 
        ADD COLUMN supplier_id INTEGER REFERENCES suppliers(id)
      `);
      console.log('supplier_id column added to purchase_orders table');
    } else {
      console.log('supplier_id column already exists');
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  addSupplierIdToPurchaseOrders()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addSupplierIdToPurchaseOrders }; 