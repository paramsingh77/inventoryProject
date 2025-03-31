const express = require('express');
const router = express.Router();
const { pool } = require('../config/db.config');

// GET products by vendor ID
router.get('/products/vendor/:vendorId', async (req, res) => {
    try {
        const { vendorId } = req.params;
        
        const result = await pool.query(
            'SELECT * FROM products WHERE vendor_id = $1 AND status = $2',
            [vendorId, 'active']
        );
        
        console.log(`Fetched ${result.rows.length} products for vendor ${vendorId}`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching vendor products:', error);
        res.status(500).json({
            message: 'Failed to fetch products',
            error: error.message
        });
    }
});

module.exports = router; 