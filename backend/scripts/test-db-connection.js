/**
 * Database Connection Test
 * Tests connection to the database and checks if required tables exist
 */

const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testDatabaseConnection() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database successfully');
    
    // Test query to check connection
    const result = await client.query('SELECT NOW()');
    console.log('Server timestamp:', result.rows[0].now);
    
    // Check if suppliers table exists
    const supplierCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'suppliers'
      );
    `);
    
    if (supplierCheck.rows[0].exists) {
      console.log('✅ Suppliers table exists');
      
      // Count suppliers
      const supplierCount = await client.query('SELECT COUNT(*) FROM suppliers');
      console.log(`Found ${supplierCount.rows[0].count} suppliers in database`);
      
      // Show supplier table structure
      const tableStructure = await client.query(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'suppliers'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nSupplier table structure:');
      console.table(tableStructure.rows);
    } else {
      console.error('❌ Suppliers table does not exist!');
    }
    
    // Check if purchase_orders table exists
    const poCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'purchase_orders'
      );
    `);
    
    if (poCheck.rows[0].exists) {
      console.log('✅ Purchase orders table exists');
      
      // Count purchase orders
      const poCount = await client.query('SELECT COUNT(*) FROM purchase_orders');
      console.log(`Found ${poCount.rows[0].count} purchase orders in database`);
    } else {
      console.log('❌ Purchase orders table does not exist');
    }
    
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

console.log('Testing database connection...');
testDatabaseConnection()
  .then(() => console.log('Database connection test completed'))
  .catch(err => {
    console.error('Database connection test failed:', err);
    process.exit(1);
  }); 