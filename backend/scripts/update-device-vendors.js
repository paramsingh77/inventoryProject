/**
 * Update Device Vendors
 * 
 * This script updates the vendor field in device_inventory table
 * based on the device_model field.
 */

const db = require('../database/db');
const path = require('path');

// Simple console logger
const logger = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

// Map to extract manufacturer from device model
const extractManufacturer = (deviceModel) => {
  if (!deviceModel) return 'Unknown Manufacturer';
  
  const modelLower = deviceModel.toLowerCase();
  
  if (modelLower.includes('hp') || modelLower.includes('compaq')) {
    return 'HP Inc.';
  } else if (modelLower.includes('optiplex') || 
             modelLower.includes('latitude') || 
             modelLower.includes('inspiron') || 
             modelLower.includes('xps') ||
             modelLower.includes('vostro') ||
             modelLower.includes('poweredge')) {
    return 'Dell Technologies';
  } else if (modelLower.includes('lenovo') || 
             (deviceModel.match && deviceModel.match(/^[0-9]{2}[A-Z]{3}[0-9]{5}$/))) {
    return 'Lenovo Group Limited';
  } else if (modelLower.includes('vmware')) {
    return 'VMware, Inc.';
  } else if (modelLower.includes('stealth')) {
    return 'Stealth Computer';
  } else {
    return 'Unknown Manufacturer';
  }
};

// Main function to update device vendors
const updateDeviceVendors = async () => {
  logger('Starting to update device vendors...');
  
  try {
    // Check if pool is available
    if (!db.pool) {
      throw new Error('Database pool is not initialized');
    }
    
    // Test the connection
    logger('Testing database connection...');
    const testResult = await db.safeQuery('SELECT 1 as test');
    logger('Database connection successful');
    
    // Get all device models
    logger('Querying device inventory...');
    const deviceResult = await db.safeQuery(
      'SELECT id, device_model FROM device_inventory WHERE device_model IS NOT NULL AND device_model != \'\'',
      []
    );
    
    if (deviceResult.rows.length === 0) {
      logger('No devices found. Exiting.');
      return;
    }
    
    logger(`Found ${deviceResult.rows.length} devices to update`);
    
    // Update vendors one by one
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const device of deviceResult.rows) {
      try {
        const manufacturer = extractManufacturer(device.device_model);
        
        // Update device vendor
        const updateResult = await db.safeQuery(
          'UPDATE device_inventory SET vendor = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
          [manufacturer, device.id]
        );
        
        if (updateResult.rows.length > 0) {
          updatedCount++;
          if (updatedCount % 10 === 0) {
            logger(`Updated ${updatedCount} devices so far...`);
          }
        } else {
          skippedCount++;
        }
      } catch (error) {
        logger(`Error updating device ${device.id}: ${error.message}`);
        errorCount++;
      }
    }
    
    logger(`Finished updating device vendors.`);
    logger(`Results: ${updatedCount} updated, ${skippedCount} skipped, ${errorCount} errors`);
  } catch (error) {
    logger(`Error updating device vendors: ${error.message}`);
    throw error;
  }
};

// Export the function
module.exports = updateDeviceVendors; 