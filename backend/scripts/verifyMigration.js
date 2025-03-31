const { pool } = require('../database/schema');

async function verifySiteMigration() {
  const client = await pool.connect();
  try {
    // Get all sites
    const sites = await client.query('SELECT id, name FROM sites WHERE is_active = true');
    
    console.log(`\nVerifying migration for ${sites.rows.length} sites...\n`);
    
    for (const site of sites.rows) {
      const siteName = site.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      console.log(`\nChecking site: ${site.name}`);
      
      // Check if tables exist
      const tables = ['inventory', 'suppliers', 'purchase_orders', 'order_items'];
      for (const table of tables) {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [`${siteName}_${table}`]);
        
        console.log(`- ${siteName}_${table} table exists: ${result.rows[0].exists}`);
        
        if (result.rows[0].exists) {
          // Count records
          const countResult = await client.query(
            `SELECT COUNT(*) FROM ${siteName}_${table}`
          );
          console.log(`  Records count: ${countResult.rows[0].count}`);
        }
      }
    }
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    client.release();
  }
}

// Run verification
verifySiteMigration().then(() => {
  console.log('\nVerification completed');
  process.exit(0);
}).catch(error => {
  console.error('\nVerification failed:', error);
  process.exit(1);
}); 