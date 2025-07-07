const { pool } = require('../database/schema');

async function shouldUseSiteTables(siteId) {
  console.log('🔴 [SITE_UTILS] Checking if site-specific tables should be used:', {
    siteId: siteId,
    type: typeof siteId,
    timestamp: new Date().toISOString()
  });

  try {
    // Get site name
    const siteResult = await pool.query(
      'SELECT name FROM sites WHERE id = $1',
      [siteId]
    );
    
    if (siteResult.rows.length === 0) {
      return false;
    }

    const siteName = siteResult.rows[0].name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');

    // Check if site-specific tables exist
    const client = await pool.connect();
    const result = await client.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = $1
      )`,
      [`site_${siteId}_purchase_orders`]
    );
    
    const useSiteTables = result.rows[0].exists;
    console.log('🔴 [SITE_UTILS] Table strategy decision:', {
      siteId: siteId,
      useSiteTables: useSiteTables,
      timestamp: new Date().toISOString()
    });
    
    client.release();
    return useSiteTables;
  } catch (error) {
    console.error('❌ [SITE_UTILS] Error checking site tables:', error);
    return false;
  }
}

module.exports = { shouldUseSiteTables }; 