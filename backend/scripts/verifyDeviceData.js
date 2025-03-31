const { pool } = require('../database/schema');
const fs = require('fs');
const path = require('path');

async function verifyDeviceData() {
  const client = await pool.connect();
  
  try {
    // Get all CSV files to check against
    const files = fs.readdirSync(path.join(__dirname, '../sitesData'))
                   .filter(file => file.endsWith('.csv'));

    console.log('\nVerifying device data migration...\n');

    for (const file of files) {
      const siteName = path.basename(file, '.csv')
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, '_');

      console.log(`\nChecking site: ${siteName}`);

      // Check if table exists
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )
      `, [`${siteName}_device_inventory`]);

      if (tableExists.rows[0].exists) {
        // Get record count
        const countResult = await client.query(
          `SELECT COUNT(*) FROM ${siteName}_device_inventory`
        );
        
        // Get sample records
        const sampleResult = await client.query(
          `SELECT * FROM ${siteName}_device_inventory LIMIT 5`
        );

        console.log(`- Table exists: Yes`);
        console.log(`- Total records: ${countResult.rows[0].count}`);
        console.log('- Sample device hostnames:');
        sampleResult.rows.forEach(row => {
          console.log(`  * ${row.device_hostname}`);
        });
      } else {
        console.log(`- Table does not exist for ${siteName}`);
      }
    }
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    client.release();
  }
}

// Run verification
verifyDeviceData().then(() => {
  console.log('\nVerification completed');
  process.exit(0);
}).catch(error => {
  console.error('\nVerification failed:', error);
  process.exit(1);
}); 