const { pool } = require('../database/schema');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

async function reimportSiteData(siteName) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const sanitizedSiteName = siteName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const dataPath = path.join(__dirname, '../sitesData', siteName);
    
    if (!fs.existsSync(dataPath)) {
      throw new Error(`No data directory found for site: ${siteName}`);
    }

    // Process each CSV file
    const files = fs.readdirSync(dataPath);
    for (const file of files) {
      if (!file.endsWith('.csv')) continue;
      
      console.log(`Processing ${file} for ${siteName}...`);
      const rows = [];
      
      await new Promise((resolve, reject) => {
        fs.createReadStream(path.join(dataPath, file))
          .pipe(csv())
          .on('data', (row) => rows.push(row))
          .on('end', resolve)
          .on('error', reject);
      });

      // Import data based on file name
      if (file.includes('inventory')) {
        await importInventory(client, sanitizedSiteName, rows);
      } else if (file.includes('suppliers')) {
        await importSuppliers(client, sanitizedSiteName, rows);
      } else if (file.includes('purchase_orders')) {
        await importPurchaseOrders(client, sanitizedSiteName, rows);
      }
    }

    await client.query('COMMIT');
    console.log(`Reimport completed for ${siteName}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Reimport failed for ${siteName}:`, error);
  } finally {
    client.release();
  }
}

// Usage:
// node reimportSiteData.js "Dameron Hospital"
const siteName = process.argv[2];
if (!siteName) {
  console.error('Please provide a site name');
  process.exit(1);
}

reimportSiteData(siteName); 