/**
 * Sync Vendors to Suppliers
 * 
 * This script orchestrates the synchronization of vendor information 
 * from device inventory to suppliers table.
 */

const path = require('path');
const updateDeviceVendors = require('./update-device-vendors');
const populateSuppliers = require('./populate-suppliers');
const db = require('../database/db');

// Simple console logger
const logger = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

/**
 * The main synchronization function that coordinates the process
 */
const syncVendorsToSuppliers = async () => {
  logger('Starting vendor to supplier synchronization process...');
  
  try {
    // Verify database connection
    if (!db.pool) {
      throw new Error('Database pool is not initialized');
    }
    
    // Test the connection
    logger('Testing database connection...');
    await db.safeQuery('SELECT 1 as test');
    logger('Database connection successful');
    
    // Step 1: Update device vendors from device models
    logger('Step 1: Updating device vendors from device models...');
    try {
      await updateDeviceVendors();
      logger('Successfully updated device vendors');
    } catch (error) {
      logger(`Error updating device vendors: ${error.message}`);
      throw new Error(`Vendor update failed: ${error.message}`);
    }
    
    // Step 2: Populate suppliers from vendor information
    logger('Step 2: Populating suppliers from vendor information...');
    try {
      await populateSuppliers();
      logger('Successfully populated suppliers');
    } catch (error) {
      logger(`Error populating suppliers: ${error.message}`);
      throw new Error(`Supplier population failed: ${error.message}`);
    }
    
    logger('Vendor to supplier synchronization completed successfully!');
    return {
      success: true,
      message: 'Synchronization completed successfully'
    };
  } catch (error) {
    const errorMessage = `Synchronization failed: ${error.message}`;
    logger(errorMessage);
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Export the function
module.exports = syncVendorsToSuppliers;

// If this script is run directly
if (require.main === module) {
  syncVendorsToSuppliers()
    .then(result => {
      if (result.success) {
        logger('SYNC COMPLETED: ' + result.message);
        process.exit(0);
      } else {
        logger('SYNC FAILED: ' + result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      logger(`FATAL SYNC ERROR: ${error.message}`);
      process.exit(1);
    });
} 