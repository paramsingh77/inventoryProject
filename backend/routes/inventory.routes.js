const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const pool = require('../config/db.config');

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

module.exports = router; 