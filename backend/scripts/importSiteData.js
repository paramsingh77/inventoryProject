const fs = require('fs');
const path = require('path');
const { pool } = require('../database/schema');
const { processFile } = require('../routes/site.routes');

async function importAllSiteData() {
  const client = await pool.connect();
  try {
    // Get all sites
    const sites = await client.query('SELECT id, name FROM sites WHERE is_active = true');
    
    for (const site of sites.rows) {
      console.log(`Processing data for site: ${site.name}`);
      const siteDir = path.join(__dirname, '../sitesData', site.name);
      
      if (fs.existsSync(siteDir)) {
        const files = fs.readdirSync(siteDir);
        
        for (const file of files) {
          console.log(`Processing file: ${file}`);
          const filePath = path.join(siteDir, file);
          const dataType = getDataTypeFromFilename(file);
          
          const results = [];
          const errorLog = [];
          
          await processFile(filePath, dataType, client, site.id, results, errorLog);
          
          console.log(`Completed ${file}: ${results.length} rows processed, ${errorLog.length} errors`);
          if (errorLog.length > 0) {
            fs.writeFileSync(
              path.join(siteDir, `${file}_errors.log`),
              errorLog.join('\n')
            );
          }
        }
      } else {
        console.log(`No data directory found for site: ${site.name}`);
      }
    }
  } catch (error) {
    console.error('Error importing site data:', error);
  } finally {
    client.release();
  }
}

// Run the import
importAllSiteData().then(() => {
  console.log('Import completed');
  process.exit(0);
}).catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
}); 