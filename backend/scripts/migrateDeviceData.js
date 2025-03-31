const { pool } = require('../database/schema');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const format = require('pg-format');

async function migrateDeviceData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Get all CSV files from sitesData directory
    const sitesDataPath = path.join(__dirname, '..', 'sitesData');
    const files = fs.readdirSync(sitesDataPath)
                   .filter(file => file.endsWith('.csv'));

    for (const file of files) {
      const siteName = path.basename(file, '.csv')
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, '_');

      console.log(`Processing ${file} for site: ${siteName}`);

      // Create table for this site
      await client.query('SELECT create_site_device_table($1)', [siteName]);

      // Read and process CSV file
      const rows = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(path.join(sitesDataPath, file))
          .pipe(csv())
          .on('data', (row) => {
            // Transform MAC addresses string to array
            const macAddresses = row['MAC Address(es)']
              ? row['MAC Address(es)'].split(',').map(mac => mac.trim())
              : [];

            // Format the row for insertion
            rows.push([
              row['Device Hostname'] || null,
              row['Device Description'] || null,
              row['Last User'] || null,
              row['Last Seen'] ? new Date(row['Last Seen']) : null,
              row['Device Type'] || null,
              row['Device Model'] || null,
              row['Operating System'] || null,
              row['Serial Number'] || null,
              row['Device CPU'] || null,
              macAddresses
            ]);
          })
          .on('end', resolve)
          .on('error', reject);
      });

      if (rows.length > 0) {
        // Bulk insert the data
        const query = format(
          `INSERT INTO ${siteName}_device_inventory (
            device_hostname, 
            device_description,
            last_user,
            last_seen,
            device_type,
            device_model,
            operating_system,
            serial_number,
            device_cpu,
            mac_addresses
          ) 
          VALUES %L 
          ON CONFLICT (serial_number) 
          DO UPDATE SET 
            device_hostname = EXCLUDED.device_hostname,
            device_description = EXCLUDED.device_description,
            last_user = EXCLUDED.last_user,
            last_seen = EXCLUDED.last_seen,
            device_type = EXCLUDED.device_type,
            device_model = EXCLUDED.device_model,
            operating_system = EXCLUDED.operating_system,
            device_cpu = EXCLUDED.device_cpu,
            mac_addresses = EXCLUDED.mac_addresses,
            updated_at = CURRENT_TIMESTAMP`,
          rows
        );

        await client.query(query);
        console.log(`Imported ${rows.length} devices for ${siteName}`);
      }
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

// Run the migration
migrateDeviceData().then(() => {
  console.log('Device data migration completed');
  process.exit(0);
}).catch(error => {
  console.error('Device data migration failed:', error);
  process.exit(1);
}); 