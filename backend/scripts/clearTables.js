const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the backend .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function clearTables() {
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Disable triggers temporarily
    await client.query('SET session_replication_role = replica;');
    
    console.log('Clearing tables...');
    
    // Delete in the correct order - dependent tables first
    // 1. First delete from invoices (which reference purchase_orders)
    await client.query('DELETE FROM invoices');
    console.log('Cleared invoices table');
    
    // 2. Then delete from order_items (which reference purchase_orders)
    await client.query('DELETE FROM order_items');
    console.log('Cleared order_items table');
    
    // 3. Now you can delete from purchase_orders
    await client.query('DELETE FROM purchase_orders');
    console.log('Cleared purchase_orders table');
    
    // Delete from other tables as needed
    await client.query('DELETE FROM suppliers');
    console.log('Cleared suppliers table');
    
    // Re-enable triggers
    await client.query('SET session_replication_role = DEFAULT;');
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('All tables cleared successfully');
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Error clearing tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

clearTables().catch(console.error); 