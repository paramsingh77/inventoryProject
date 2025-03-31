const { pool } = require('../database/schema');

async function shouldUseSiteTables(siteId) {
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
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )
    `, [`${siteName}_inventory`]);

    return result.rows[0].exists;
  } catch (error) {
    console.error('Error checking site tables:', error);
    return false;
  }
}

module.exports = { shouldUseSiteTables }; 