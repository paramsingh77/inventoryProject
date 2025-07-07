const pool = require('../config/database.js');

async function updateExistingPOsSiteId() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 [UPDATE_POS] Starting to update existing POs with null site_id...');
    
    // First, get the site ID for "Amarillo Specialty Hospital"
    const siteResult = await client.query(
      'SELECT id FROM sites WHERE name = $1',
      ['Amarillo Specialty Hospital']
    );
    
    if (siteResult.rows.length === 0) {
      console.error('❌ [UPDATE_POS] Site "Amarillo Specialty Hospital" not found');
      return;
    }
    
    const siteId = siteResult.rows[0].id;
    console.log('🔧 [UPDATE_POS] Found site ID:', siteId);
    
    // Count POs with null site_id
    const countResult = await client.query(
      'SELECT COUNT(*) as count FROM purchase_orders WHERE site_id IS NULL'
    );
    
    const nullSiteIdCount = countResult.rows[0].count;
    console.log('🔧 [UPDATE_POS] Found', nullSiteIdCount, 'POs with null site_id');
    
    if (nullSiteIdCount === 0) {
      console.log('✅ [UPDATE_POS] No POs with null site_id found');
      return;
    }
    
    // Update all POs with null site_id to use the correct site_id
    const updateResult = await client.query(
      'UPDATE purchase_orders SET site_id = $1 WHERE site_id IS NULL',
      [siteId]
    );
    
    console.log('✅ [UPDATE_POS] Updated', updateResult.rowCount, 'POs with site_id =', siteId);
    
    // Verify the update
    const verifyResult = await client.query(
      'SELECT COUNT(*) as count FROM purchase_orders WHERE site_id = $1',
      [siteId]
    );
    
    console.log('✅ [UPDATE_POS] Total POs with site_id =', siteId, ':', verifyResult.rows[0].count);
    
  } catch (error) {
    console.error('❌ [UPDATE_POS] Error updating POs:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
updateExistingPOsSiteId(); 