const { pool } = require('../database/schema');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const format = require('pg-format');

async function migrateAAM() {
  let client;
  
  try {
    // Configure client with longer timeout
    client = new pool.Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      statement_timeout: 300000, // 5 minutes
      query_timeout: 300000,     // 5 minutes
      connectionTimeoutMillis: 300000,
      idle_in_transaction_session_timeout: 300000
    });

    await client.connect();
    await client.query('BEGIN');

    // Drop existing AAM table
    console.log('Dropping existing AAM table...');
    await client.query('DROP TABLE IF EXISTS aam_device_inventory CASCADE');

    // Create table
    console.log('Creating new table...');
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
        status VARCHAR(50) DEFAULT 'active',
        vendor VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Read and process AAM file
    console.log('Processing AAM data...');
    const rows = await readAAMFile();
    
    // Process in smaller batches
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      await insertBatch(client, batch);
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

async function readAAMFile() {
  return new Promise((resolve, reject) => {
    const rows = new Map(); // Use map to handle duplicates
    
    fs.createReadStream(path.join(__dirname, '../sitesData/aam.csv'))
      .pipe(csv())
      .on('data', (row) => {
        const macAddresses = row['MAC Address(es)']
          ? `{${row['MAC Address(es)'].split(',').map(mac => `"${mac.trim()}"`).join(',')}}`
          : null;

        const serialNumber = row['Serial Number'];
        if (!serialNumber) return; // Skip rows without serial number

        const newRow = {
          site_name: 'AAM',
          device_hostname: row['Hostname'] || null,
          device_description: row['Description'] || null,
          last_user: row['Last User'] || null,
          last_seen: row['Last Seen'] ? new Date(row['Last Seen']) : null,
          device_type: row['Type'] || null,
          device_model: null,
          operating_system: row['OS'] || null,
          serial_number: serialNumber,
          device_cpu: row['Device CPU'] || null,
          mac_addresses: macAddresses,
          status: row['Status'] || 'active',
          vendor: null
        };

        // Keep only the most recent entry for each serial number
        const existing = rows.get(serialNumber);
        if (!existing || (newRow.last_seen && (!existing.last_seen || new Date(newRow.last_seen) > new Date(existing.last_seen)))) {
          rows.set(serialNumber, newRow);
        }
      })
      .on('end', () => resolve(Array.from(rows.values())))
      .on('error', reject);
  });
}

async function insertBatch(client, batch) {
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
}

// Run the migration
migrateAAM().then(() => {
  console.log('AAM migration completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
}); 