const Vendor = require('../models/vendor.model');
const { pool } = require('../config/db.config');

const getAllVendors = async (req, res) => {
    try {
        // Log the database connection status
        console.log('Database connection state:', pool.state);
        
        const query = `
            SELECT 
                v.id,
                v.name,
                v.email,
                v.phone,
                v.address,
                v.contact_person,
                v.status,
                v.created_at,
                v.updated_at
            FROM vendors v
            WHERE v.status = 'active'
            ORDER BY v.name ASC
        `;

        const [vendors] = await pool.query(query);
        console.log(`Found ${vendors.length} vendors`);

        res.json(vendors);
    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({
            message: 'Failed to fetch vendors',
            error: error.message
        });
    }
};

module.exports = {
    getAllVendors
}; 