const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const pool = require('../config/db.config');
const { withDbClient } = require('../utils/dbUtils');

// Add this site-to-table mapping at the top of your file
const siteToTableMap = {
  "Dameron Hospital": "dameron_hospital_device_inventory",
  "American Advance Management": "aam_device_inventory",
  "Colusa Medical Center": "colusa_medical_center_device_inventory",
  "Glenn Medical Center": "glenn_medical_center_device_inventory",
  "Kentfield Marin": "kentfield_marin_device_inventory",
  "Kentfield San Francisco": "kentfield_san_francisco_device_inventory",
  "Amarillo Specialty Hospital": "amarillo_specialty_hospital_device_inventory",
  "Baton Rouge Specialty Hospital": "baton_rouge_specialty_hospital_device_inventory",
  "Central Valley Specialty Hospital": "central_valley_specialty_hospital_device_inventory",
  "Coalinga Regional Medical Center": "coalinga_regional_medical_center_device_inventory",
  // Add remaining mappings as needed
};

// Get inventory for a specific site
router.get('/:siteId', authenticateToken, async (req, res) => {
  try {
    const { siteId } = req.params;
    
    // First verify if user has access to this site
    const userAccess = await pool.query(`
      SELECT r.name as role
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND (r.name = 'admin' OR ur.site_id = $2)
    `, [req.user.id, siteId]);

    if (userAccess.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this site'
      });
    }

    // Get site details
    const siteQuery = `
      SELECT name, location, image_url
      FROM sites
      WHERE id = $1
    `;
    
    // Get inventory items for the site
    const inventoryQuery = `
      SELECT 
        i.id,
        i.item_name,
        i.category,
        i.quantity,
        i.unit,
        i.last_updated,
        i.minimum_quantity,
        i.maximum_quantity,
        i.status,
        i.notes
      FROM inventory i
      WHERE i.site_id = $1
      ORDER BY i.category, i.item_name
    `;

    const [siteResult, inventoryResult] = await Promise.all([
      pool.query(siteQuery, [siteId]),
      pool.query(inventoryQuery, [siteId])
    ]);

    if (siteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    res.json({
      success: true,
      site: siteResult.rows[0],
      inventory: inventoryResult.rows
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update the site-specific devices endpoint to use the mapping
router.get('/site/:siteName/devices', async (req, res) => {
  let client;
  try {
    const { siteName } = req.params;
    client = await pool.connect();
    
    // Get table name from mapping or generate it
    let tableName = siteToTableMap[siteName];
    
    // If not in mapping, generate table name from site name
    if (!tableName) {
      const formattedSiteName = siteName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      tableName = `${formattedSiteName}_device_inventory`;
      console.log(`No mapping found for "${siteName}", using generated table name: ${tableName}`);
    }
    
    console.log(`Fetching devices from table: ${tableName}`);

    // Verify table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      );
    `, [tableName]);

    if (!tableExists.rows[0].exists) {
      console.log(`Table ${tableName} not found, falling back to device_inventory table with location filter`);
      
      // If site-specific table doesn't exist, fall back to the main device_inventory table
      const result = await client.query(`
        SELECT * FROM device_inventory
        WHERE location ILIKE $1
        ORDER BY device_hostname ASC
      `, [`%${siteName}%`]);

      return res.json({
        site: siteName,
        devices: result.rows.map(device => ({
          ...device,
          site_name: siteName
        }))
      });
    }

    // Use site-specific table
    const result = await client.query(`
      SELECT * FROM ${tableName}
      ORDER BY device_hostname ASC
    `);

    res.json({
      site: siteName,
      devices: result.rows.map(device => ({
        ...device,
        site_name: siteName
      }))
    });

  } catch (error) {
    console.error('Error fetching site inventory:', error);
    res.status(500).json({ 
      error: 'Failed to fetch site inventory', 
      details: error.message,
      devices: []
    });
  } finally {
    // Only release the client if it was successfully acquired
    if (client) {
      try {
        await client.release();
      } catch (releaseError) {
        console.error('Error releasing client:', releaseError);
      }
    }
  }
});

// Add support for the legacy URL format
router.get('/:siteName/inventory', async (req, res) => {
  try {
    const { siteName } = req.params;
    
    const result = await withDbClient(async (client) => {
      // Format the table name correctly
      const formattedSiteName = siteName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const tableName = `${formattedSiteName}_device_inventory`;
      
      console.log(`Fetching devices from table: ${tableName}`);

      // Verify table exists
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [tableName]);

      if (!tableExists.rows[0].exists) {
        // Fallback to main table
        const result = await client.query(`
          SELECT * FROM device_inventory
          WHERE location ILIKE $1
          ORDER BY device_hostname ASC
        `, [`%${siteName}%`]);

        return {
          site: siteName,
          devices: result.rows.map(device => ({
            ...device,
            site_name: siteName
          }))
        };
      }

      // Use site-specific table
      const result = await client.query(`
        SELECT * FROM ${tableName}
        ORDER BY device_hostname ASC
      `);

      return {
        site: siteName,
        devices: result.rows.map(device => ({
          ...device,
          site_name: siteName
        }))
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching site inventory:', error);
    res.status(500).json({ 
      error: 'Failed to fetch site inventory', 
      details: error.message,
      devices: []
    });
  }
});

// Add a route to handle the frontend URL pattern
router.get('/inventory/:siteName/inventory', async (req, res) => {
  const { siteName } = req.params;
  res.redirect(`/api/inventory/site/${siteName}/devices`);
});

module.exports = router; 