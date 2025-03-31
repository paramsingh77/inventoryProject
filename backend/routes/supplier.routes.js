/**
 * Supplier Routes
 * Handles all API endpoints for supplier management
 */

const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const auth = require('../middleware/auth');
const { spawn } = require('child_process');
const path = require('path');
const pool = require('../database/db');

// Apply authentication middleware to all supplier routes
router.use(auth);

// GET all suppliers
router.get('/suppliers', supplierController.getAllSuppliers);

// GET supplier statistics (this must come before /:id routes to avoid parameter confusion)
router.get('/suppliers/stats', supplierController.getSupplierStats);

// POST sync vendors to suppliers
router.post('/suppliers/sync-from-inventory', async (req, res) => {
  try {
    console.log('Starting vendor-supplier synchronization process...');
    
    // Get absolute path to the scripts directory
    const scriptsDir = path.resolve(__dirname, '../scripts');
    console.log('Scripts directory:', scriptsDir);
    
    // Create logs directory if it doesn't exist
    const logsDir = path.resolve(__dirname, '../logs');
    if (!require('fs').existsSync(logsDir)) {
      require('fs').mkdirSync(logsDir, { recursive: true });
      console.log('Created logs directory:', logsDir);
    }
    
    // Instead of spawning a child process, require and run the scripts directly
    try {
      console.log('Executing vendor update script...');
      const updateDeviceVendors = require('../scripts/update-device-vendors');
      await updateDeviceVendors();
      
      console.log('Executing supplier population script...');
      const populateSuppliers = require('../scripts/populate-suppliers');
      await populateSuppliers();
      
      // If we reach here, both scripts executed successfully
      console.log('Sync process completed successfully!');
      
      return res.status(200).json({
        success: true,
        message: 'Vendor-supplier synchronization completed successfully!'
      });
    } catch (scriptError) {
      console.error('Error executing sync scripts:', scriptError);
      return res.status(500).json({
        success: false,
        message: 'Error during synchronization process',
        error: scriptError.message
      });
    }
  } catch (error) {
    console.error('Error starting synchronization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start vendor-supplier synchronization',
      error: error.message
    });
  }
});

// Sync endpoint - Directly run the synchronization script
router.post('/suppliers/sync', auth, async (req, res) => {
  try {
    const syncVendorsToSuppliers = require('../scripts/sync-vendors-to-suppliers');
    
    console.log('Starting vendor to supplier synchronization...');
    
    // Run the synchronization directly instead of spawning a child process
    const result = await syncVendorsToSuppliers();
    
    if (result.success) {
      console.log('Synchronization completed successfully');
      return res.status(200).json({ 
        message: 'Suppliers synchronized successfully from inventory', 
        details: result.message 
      });
    } else {
      console.error('Synchronization failed:', result.error);
      return res.status(500).json({ 
        error: 'Failed to sync suppliers from inventory', 
        details: result.error
      });
    }
  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({ 
      error: 'Failed to sync suppliers from inventory', 
      details: error.message 
    });
  }
});

// GET supplier by ID
router.get('/suppliers/:id', supplierController.getSupplierById);

// POST create new supplier
router.post('/suppliers', supplierController.createSupplier);

// PUT update supplier
router.put('/suppliers/:id', supplierController.updateSupplier);

// DELETE supplier (soft delete)
router.delete('/suppliers/:id', supplierController.deleteSupplier);

// GET supplier products
router.get('/suppliers/:id/products', supplierController.getSupplierProducts);

// POST add product to supplier
router.post('/suppliers/:id/products', supplierController.addSupplierProduct);

// Simplified sync endpoint
router.post('/sync', auth, async (req, res) => {
  try {
    console.log('Starting supplier sync from device inventory...');
    
    // Check the database connection first
    console.log('Testing database connection...');
    const testQuery = 'SELECT NOW()';
    await pool.query(testQuery);
    console.log('Database connection successful');
    
    // 1. Get unique vendors from device_inventory
    const vendorsQuery = `
      SELECT DISTINCT 
        vendor as supplier_name,
        COUNT(*) as device_count,
        STRING_AGG(DISTINCT device_type, ', ') as products
      FROM device_inventory
      WHERE vendor IS NOT NULL
      GROUP BY vendor
      ORDER BY vendor
    `;
    
    const { rows: vendors } = await pool.query(vendorsQuery);
    console.log(`Found ${vendors.length} vendors in device inventory`);
    
    // 2. For each vendor, check if it exists in suppliers table
    let newCount = 0;
    let updatedCount = 0;
    
    for (const vendor of vendors) {
      // Check if supplier exists
      const checkQuery = `
        SELECT id FROM suppliers 
        WHERE LOWER(name) = LOWER($1)
      `;
      
      const { rows: existing } = await pool.query(checkQuery, [vendor.supplier_name]);
      
      if (existing.length > 0) {
        // Update existing supplier
        console.log(`Updating existing supplier: ${vendor.supplier_name}`);
        updatedCount++;
      } else {
        // Insert new supplier
        console.log(`Creating new supplier: ${vendor.supplier_name}`);
        const insertQuery = `
          INSERT INTO suppliers (
            name, 
            contact_info,
            status,
            created_at,
            updated_at
          ) VALUES (
            $1,
            $2,
            'active',
            NOW(),
            NOW()
          )
        `;
        
        const contactInfo = JSON.stringify({
          email: '',
          phone: '',
          address: '',
          notes: `Auto-imported from device inventory. Found ${vendor.device_count} devices.`
        });
        
        await pool.query(insertQuery, [vendor.supplier_name, contactInfo]);
        newCount++;
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Sync completed. Added ${newCount} new suppliers, updated ${updatedCount} existing suppliers.`,
      summary: {
        totalVendors: vendors.length,
        newSuppliers: newCount,
        updatedSuppliers: updatedCount,
        lastSynced: new Date().toISOString(),
        vendorDetails: vendors
      }
    });
    
  } catch (error) {
    console.error('Error during supplier sync:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to sync suppliers from inventory',
      details: error.message,
      stack: error.stack // Include stack trace for debugging
    });
  }
});

module.exports = router; 