const { pool } = require('./schema');

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('Running database migrations...');
    
    // Add email_sent_count column to purchase_orders table if it doesn't exist
    await client.query(`
      ALTER TABLE purchase_orders 
      ADD COLUMN IF NOT EXISTS email_sent_count INTEGER DEFAULT 0;
    `);
    
    // Add email_sent column to purchase_orders table if it doesn't exist
    await client.query(`
      ALTER TABLE purchase_orders 
      ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false;
    `);
    
    // Add last_email_sent column to purchase_orders table if it doesn't exist
    await client.query(`
      ALTER TABLE purchase_orders 
      ADD COLUMN IF NOT EXISTS last_email_sent TIMESTAMP WITH TIME ZONE;
    `);
    
    // Add any additional production migrations here
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    // Don't throw error in production, just log it
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }
  } finally {
    client.release();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations().then(() => {
    console.log('Migration script completed');
    process.exit(0);
  }).catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

module.exports = { runMigrations }; 