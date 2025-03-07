const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const pool = require('../config/db.config');

// Get all sites (protected route)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const sitesQuery = `
      SELECT id, name, location, image_url, is_active
      FROM sites
      ORDER BY name ASC
    `;
    
    const result = await pool.query(sitesQuery);
    
    res.json({
      success: true,
      sites: result.rows
    });
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 