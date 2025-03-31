const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Get all sites
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM sites ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sites:', error);
    
    // If database query fails, return hardcoded sites
    const hardcodedSites = [
      { id: 'dameron', name: 'Dameron Hospital', location: 'Stockton' },
      { id: 'aam', name: 'American Advance Management', location: 'Modesto' },
      { id: 'phoenix', name: 'Phoenix Specialty Hospital', location: 'Phoenix' },
      { id: 'cvsh', name: 'Central Valley Specialty Hospital', location: '' },
      { id: 'crmc', name: 'Coalinga Regional Medical Center', location: 'Coalinga' },
      { id: 'orchard', name: 'Orchard Hospital', location: '' },
      { id: 'glenn', name: 'Glenn Medical Center', location: 'Willows' },
      { id: 'sonoma', name: 'Sonoma Specialty Hospital', location: 'Sonoma' },
      { id: 'kentfield-sf', name: 'Kentfield', location: 'San Francisco' },
      { id: 'kentfield-marin', name: 'Kentfield', location: 'Marin' },
      { id: 'aurora', name: 'Aurora', location: 'San Diego' },
      { id: 'slsh', name: 'Salt Lake Specialty Hospital', location: 'Salt Lake' },
      { id: 'brsh', name: 'Baton Rouge Specialty Hospital', location: 'Louisiana' },
      { id: 'madera', name: 'Madera Community Hospital', location: 'Madera' },
      { id: 'colusa', name: 'Colusa Medical Center', location: 'Colusa' },
      { id: 'williams', name: 'Williams', location: '' },
      { id: 'west-huschle', name: 'West Huschle', location: '' },
      { id: 'amarillo', name: 'Amarillo Specialty Hospital', location: 'Amarillo' }
    ];
    
    res.json(hardcodedSites);
  }
});

// Get a specific site
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM sites WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching site:', error);
    res.status(500).json({ error: 'Failed to fetch site' });
  }
});

module.exports = router; 