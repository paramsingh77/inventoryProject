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
const { pool, safeQuery } = require('../database/db');

// Apply authentication middleware to all supplier routes
router.use(auth);

// FIXED: Reorder routes to avoid conflicts - specific routes first, then parameterized routes

// GET all suppliers (must come before /:id routes)
router.get('/', supplierController.getAllSuppliers);

// POST create new supplier (must come before /:id routes)
router.post('/', supplierController.createSupplier);

// GET supplier statistics (must come before /:id routes)
router.get('/stats', supplierController.getSupplierStats);

// GET supplier by name (must come before /:id routes)
router.get('/by-name/:name', supplierController.getSupplierByName);

// POST sync vendors to suppliers (must come before /:id routes)
router.post('/sync-from-inventory', async (req, res) => {
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



// GET supplier products (must come before /:id routes)
router.get('/:id/products', supplierController.getSupplierProducts);

// POST add product to supplier (must come before /:id routes)
router.post('/:id/products', supplierController.addSupplierProduct);

// GET supplier by ID (parameterized route - comes after specific routes)
router.get('/:id', supplierController.getSupplierById);

// PUT update supplier (parameterized route)
router.put('/:id', supplierController.updateSupplier);

// DELETE supplier (soft delete) (parameterized route)
router.delete('/:id', supplierController.deleteSupplier);

// Simplified sync endpoint
router.post('/sync', auth, async (req, res) => {
  try {
    console.log('Starting supplier sync from device inventory...');
    
    // Check the database connection first
    console.log('Testing database connection...');
    const testQuery = 'SELECT NOW()';
    await safeQuery(testQuery);
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
    
    const { rows: vendors } = await safeQuery(vendorsQuery);
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
      
      const { rows: existing } = await safeQuery(checkQuery, [vendor.supplier_name]);
      
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
        
        await safeQuery(insertQuery, [vendor.supplier_name, contactInfo]);
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