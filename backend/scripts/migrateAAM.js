const { pool } = require('../database/schema');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const format = require('pg-format');

async function migrateAAM() {
  let client;
  
  try {
    // Check if aam.csv exists
    const aamPath = path.join(__dirname, '../sitesData/aam.csv');
    if (!fs.existsSync(aamPath)) {
      throw new Error('aam.csv not found in sitesData directory');
    }

    // Configure client with longer timeout
    client = new pool.Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      statement_timeout: 300000,
      query_timeout: 300000,
      connectionTimeoutMillis: 300000,
      idle_in_transaction_session_timeout: 300000
    });

    await client.connect();
    await client.query('BEGIN');

    console.log('Dropping existing AAM table...');
    await client.query('DROP TABLE IF EXISTS aam_device_inventory CASCADE');

    console.log('Creating new AAM table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS aam_device_inventory (
        id SERIAL PRIMARY KEY,
        site_name VARCHAR(255),
        device_hostname VARCHAR(255),
        device_description TEXT,
        last_user VARCHAR(255),
        last_seen TIMESTAMP,
        device_type VARCHAR(100),
        device_model VARCHAR(255),
        operating_system VARCHAR(255),
        serial_number VARCHAR(255) UNIQUE,
        device_cpu VARCHAR(255),
        mac_addresses TEXT[],
        status VARCHAR(50),
        vendor VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Reading AAM data...');
    const rows = await new Promise((resolve, reject) => {
      const devices = new Map();
      
      fs.createReadStream(aamPath)
        .pipe(csv())
        .on('data', (row) => {
          const serialNumber = row['Serial Number'];
          if (!serialNumber) return;

          // Parse date safely
          let lastSeen = null;
          if (row['Last Seen']) {
            try {
              const date = new Date(row['Last Seen']);
              if (!isNaN(date.getTime())) {
                lastSeen = date.toISOString();
              }
            } catch (e) {
              console.warn(`Invalid date for serial ${serialNumber}: ${row['Last Seen']}`);
            }
          }

          // Format MAC addresses
          const macAddresses = row['MAC Address(es)']
            ? `{${row['MAC Address(es)'].split(',').map(mac => `"${mac.trim()}"`).join(',')}}`
            : null;

          const newRow = {
            site_name: 'AAM',
            device_hostname: row['Hostname'] || null,
            device_description: row['Description'] || null,
            last_user: row['Last User'] || null,
            last_seen: lastSeen,
            device_type: row['Type'] || null,
            device_model: null,
            operating_system: row['OS'] || null,
            serial_number: serialNumber,
            device_cpu: row['Device CPU'] || null,
            mac_addresses: macAddresses,
            status: row['Status'] || 'active',
            vendor: null
          };

          const existing = devices.get(serialNumber);
          if (!existing || (newRow.last_seen && (!existing.last_seen || newRow.last_seen > existing.last_seen))) {
            devices.set(serialNumber, newRow);
          }
        })
        .on('end', () => resolve(Array.from(devices.values())))
        .on('error', reject);
    });

    console.log(`Found ${rows.length} unique devices in AAM.csv`);

    // Insert in small batches
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, Math.min(i + batchSize, rows.length));
      const values = batch.map(row => [
        row.site_name,
        row.device_hostname,
        row.device_description,
        row.last_user,
        row.last_seen,
        row.device_type,
        row.device_model,
        row.operating_system,
        row.serial_number,
        row.device_cpu,
        row.mac_addresses,
        row.status,
        row.vendor
      ]);

      const query = format(`
        INSERT INTO aam_device_inventory (
          site_name,
          device_hostname,
          device_description,
          last_user,
          last_seen,
          device_type,
          device_model,
          operating_system,
          serial_number,
          device_cpu,
          mac_addresses,
          status,
          vendor
        ) 
        VALUES %L
        ON CONFLICT (serial_number) DO UPDATE SET
          site_name = EXCLUDED.site_name,
          device_hostname = EXCLUDED.device_hostname,
          device_description = EXCLUDED.device_description,
          last_user = EXCLUDED.last_user,
          last_seen = EXCLUDED.last_seen,
          device_type = EXCLUDED.device_type,
          device_model = EXCLUDED.device_model,
          operating_system = EXCLUDED.operating_system,
          device_cpu = EXCLUDED.device_cpu,
          mac_addresses = EXCLUDED.mac_addresses,
          status = EXCLUDED.status,
          vendor = EXCLUDED.vendor,
          updated_at = CURRENT_TIMESTAMP
      `, values);

      await client.query(query);
      console.log(`Processed ${i + batch.length} of ${rows.length} devices`);
    }

    await client.query('COMMIT');
    console.log('AAM migration completed successfully');

  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Migration failed:', error);
    throw error;
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Run the migration
migrateAAM().then(() => {
  console.log('AAM migration completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
}); 