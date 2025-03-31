const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Get inventory items (filtered by site if specified)
router.get('/', auth, async (req, res) => {
  try {
    const { site } = req.query;
    
    // Regular users can only see their assigned site's inventory
    if (req.user.role !== 'admin' && site && site !== req.user.assigned_site) {
      return res.status(403).json({ error: 'Access denied to this site' });
    }
    
    let query = 'SELECT * FROM inventory';
    const queryParams = [];
    
    // Filter by site if specified
    if (site) {
      query += ' WHERE site = $1';
      queryParams.push(site);
    } else if (req.user.role !== 'admin') {
      // Regular users can only see their assigned site
      query += ' WHERE site = $1';
      queryParams.push(req.user.assigned_site);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

module.exports = router; 