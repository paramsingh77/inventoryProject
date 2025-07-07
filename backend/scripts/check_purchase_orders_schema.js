const { pool } = require('../database/schema');

async function checkPurchaseOrdersSchema() {
  const client = await pool.connect();
  
  try {
    console.log('Checking purchase_orders table schema...');
    
    // Get all columns from purchase_orders table
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'purchase_orders'
      ORDER BY ordinal_position
    `);
    
    console.log('\nPurchase Orders Table Columns:');
    console.log('==============================');
    columnsResult.rows.forEach((column, index) => {
      console.log(`${index + 1}. ${column.column_name} (${column.data_type}) - Nullable: ${column.is_nullable} - Default: ${column.column_default || 'None'}`);
    });
    
    // Check if site_id column exists specifically
    const siteIdCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'purchase_orders' AND column_name = 'site_id'
    `);
    
    console.log(`\nsite_id column exists: ${siteIdCheck.rows.length > 0}`);
    
    // Check if order_number column exists
    const orderNumberCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'purchase_orders' AND column_name = 'order_number'
    `);
    
    console.log(`order_number column exists: ${orderNumberCheck.rows.length > 0}`);
    
    // Check table constraints
    const constraintsResult = await client.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints 
      WHERE table_name = 'purchase_orders'
    `);
    
    console.log('\nTable Constraints:');
    console.log('==================');
    constraintsResult.rows.forEach(constraint => {
      console.log(`${constraint.constraint_name}: ${constraint.constraint_type}`);
    });
    
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    client.release();
  }
}

// Run the check
checkPurchaseOrdersSchema()
  .then(() => {
    console.log('\nSchema check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Schema check failed:', error);
    process.exit(1);
  }); 