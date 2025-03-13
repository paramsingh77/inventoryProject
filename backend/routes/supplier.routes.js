const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const auth = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const socketIO = require('../socket');

// Get all suppliers
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, contact_person, email, phone, address, website, tax_id, payment_terms, status FROM suppliers WHERE status = $1 ORDER BY name',
            ['active']
        );
        
        // Development mode fallback
        if (process.env.NODE_ENV === 'development' && result.rows.length === 0) {
            return res.json([
                { id: 1, name: 'Test Vendor 1', email: 'vendor1@test.com' },
                { id: 2, name: 'Test Vendor 2', email: 'vendor2@test.com' }
            ]);
        }
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ message: 'Failed to fetch suppliers', error: error.message });
    }
});

// Get a supplier by ID
router.get('/suppliers/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT * FROM suppliers
            WHERE id = $1
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching supplier:', error);
        res.status(500).json({ message: 'Error fetching supplier', error: error.message });
    }
});

// Add a new supplier
router.post('/', auth, async (req, res) => {
    const { name, contact_person, email, phone, address, website, tax_id, payment_terms, notes } = req.body;
    
    try {
        const result = await pool.query(
            `INSERT INTO suppliers (name, contact_person, email, phone, address, website, tax_id, payment_terms, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [name, contact_person, email, phone, address, website, tax_id, payment_terms, notes]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating supplier:', error);
        res.status(500).json({ message: 'Failed to create supplier', error: error.message });
    }
});

// Update a supplier
router.put('/:id', auth, async (req, res) => {
    const { id } = req.params;
    const { name, contact_person, email, phone, address, website, tax_id, payment_terms, status, notes } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE suppliers 
             SET name = $1, contact_person = $2, email = $3, phone = $4, address = $5,
                 website = $6, tax_id = $7, payment_terms = $8, status = $9, notes = $10,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $11
             RETURNING *`,
            [name, contact_person, email, phone, address, website, tax_id, payment_terms, status, notes, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating supplier:', error);
        res.status(500).json({ message: 'Failed to update supplier', error: error.message });
    }
});

// Delete a supplier (soft delete)
router.delete('/:id', auth, async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await pool.query(
            `UPDATE suppliers 
             SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        
        res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        console.error('Error deleting supplier:', error);
        res.status(500).json({ message: 'Failed to delete supplier', error: error.message });
    }
});

module.exports = router; 