const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const authMiddleware = require('../middleware/auth');

// Get device statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    console.log('Processing device stats request...');

    // Get total devices
    const totalQuery = `
      SELECT COUNT(*) as total 
      FROM device_inventory
    `;
    const totalResult = await pool.query(totalQuery);
    console.log('Total devices:', totalResult.rows[0]);
    
    // Get active devices (based on last_seen)
    const activeQuery = `
      SELECT COUNT(*) as active 
      FROM device_inventory 
      WHERE last_seen > NOW() - INTERVAL '24 hours'
      AND status = 'active'
    `;
    const activeResult = await pool.query(activeQuery);
    console.log('Active devices:', activeResult.rows[0]);
    
    // Get offline devices
    const offlineQuery = `
      SELECT COUNT(*) as offline 
      FROM device_inventory 
      WHERE (last_seen < NOW() - INTERVAL '24 hours'
      OR status = 'offline')
    `;
    const offlineResult = await pool.query(offlineQuery);
    console.log('Offline devices:', offlineResult.rows[0]);
    
    // Get devices needing attention (based on lifecycle_status)
    const pendingQuery = `
      SELECT COUNT(*) as pending 
      FROM device_inventory 
      WHERE lifecycle_status IN ('pending', 'review', 'maintenance')
      OR warranty_expiry < NOW() + INTERVAL '30 days'
    `;
    const pendingResult = await pool.query(pendingQuery);
    console.log('Pending devices:', pendingResult.rows[0]);
    
    // Get recent activity (based on updated_at)
    const activityQuery = `
      SELECT COUNT(*) as recent 
      FROM device_inventory 
      WHERE updated_at > NOW() - INTERVAL '24 hours'
    `;
    const activityResult = await pool.query(activityQuery);
    console.log('Recent activity:', activityResult.rows[0]);

    // Get location breakdown
    const locationQuery = `
      SELECT location, COUNT(*) as count 
      FROM device_inventory 
      WHERE location IS NOT NULL
      GROUP BY location
    `;
    const locationResult = await pool.query(locationQuery);

    // Get department breakdown
    const departmentQuery = `
      SELECT department, COUNT(*) as count 
      FROM device_inventory 
      WHERE department IS NOT NULL
      GROUP BY department
    `;
    const departmentResult = await pool.query(departmentQuery);

    const response = {
      totalDevices: parseInt(totalResult.rows[0].total || 0),
      activeDevices: parseInt(activeResult.rows[0].active || 0),
      offlineDevices: parseInt(offlineResult.rows[0].offline || 0),
      pendingUpdates: parseInt(pendingResult.rows[0].pending || 0),
      recentActivity: parseInt(activityResult.rows[0].recent || 0),
      locationBreakdown: locationResult.rows,
      departmentBreakdown: departmentResult.rows,
      lastUpdated: new Date().toISOString()
    };

    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error in device stats:', error);
    res.status(500).json({ error: 'Failed to fetch device statistics' });
  }
});

// Get detailed stats for a specific location
router.get('/stats/location/:location', authMiddleware, async (req, res) => {
  try {
    const { location } = req.params;
    const query = `
      SELECT 
        device_type,
        device_model,
        operating_system,
        status,
        lifecycle_status,
        department,
        last_seen,
        last_user,
        device_hostname
      FROM device_inventory 
      WHERE location = $1
      ORDER BY last_seen DESC
    `;
    const result = await pool.query(query, [location]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching location stats:', error);
    res.status(500).json({ error: 'Failed to fetch location statistics' });
  }
});

// Get devices by department
router.get('/stats/department/:department', authMiddleware, async (req, res) => {
  try {
    const { department } = req.params;
    const query = `
      SELECT 
        device_hostname,
        device_model,
        operating_system,
        status,
        last_user,
        last_seen
      FROM device_inventory 
      WHERE department = $1
      ORDER BY last_seen DESC
    `;
    const result = await pool.query(query, [department]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching department stats:', error);
    res.status(500).json({ error: 'Failed to fetch department statistics' });
  }
});

// Get site-specific device statistics
router.get('/site-stats/:siteName', authMiddleware, async (req, res) => {
    try {
        const { siteName } = req.params;
        console.log('Received site name:', siteName);

        // Handle site name mapping
        const siteNameMap = {
            'American Advance Management': 'AAM',
            'AAM': 'AAM'
        };

        const normalizedSiteName = siteNameMap[siteName] || siteName;
        console.log('Normalized site name:', normalizedSiteName);

        // First, let's check what site names we have
        const siteCheckQuery = `
            SELECT DISTINCT site_name 
            FROM device_inventory
        `;
        const siteCheck = await pool.query(siteCheckQuery);
        console.log('Available sites:', siteCheck.rows);

        // Get total devices for this site
        const totalQuery = `
            SELECT COUNT(*) as total 
            FROM device_inventory 
            WHERE site_name = $1
        `;
        const totalResult = await pool.query(totalQuery, [normalizedSiteName]);
        console.log('Total query result:', totalResult.rows[0]);

        // Get active devices
        const activeQuery = `
            SELECT COUNT(*) as active 
            FROM device_inventory 
            WHERE site_name = $1
            AND last_seen >= NOW() - INTERVAL '24 hours'
        `;
        const activeResult = await pool.query(activeQuery, [normalizedSiteName]);
        console.log('Active query result:', activeResult.rows[0]);

        // Get offline devices
        const offlineQuery = `
            SELECT COUNT(*) as offline 
            FROM device_inventory 
            WHERE site_name = $1
            AND (last_seen < NOW() - INTERVAL '24 hours' OR last_seen IS NULL)
        `;
        const offlineResult = await pool.query(offlineQuery, [normalizedSiteName]);
        console.log('Offline query result:', offlineResult.rows[0]);

        // Get pending devices
        const pendingQuery = `
            SELECT COUNT(*) as pending 
            FROM device_inventory 
            WHERE site_name = $1
            AND lifecycle_status IS NOT NULL
        `;
        const pendingResult = await pool.query(pendingQuery, [normalizedSiteName]);
        console.log('Pending query result:', pendingResult.rows[0]);

        // Get recent activity
        const recentQuery = `
            SELECT COUNT(*) as recent 
            FROM device_inventory 
            WHERE site_name = $1
            AND updated_at >= NOW() - INTERVAL '24 hours'
        `;
        const recentResult = await pool.query(recentQuery, [normalizedSiteName]);
        console.log('Recent query result:', recentResult.rows[0]);

        const stats = {
            total: parseInt(totalResult.rows[0].total || 0),
            active: parseInt(activeResult.rows[0].active || 0),
            offline: parseInt(offlineResult.rows[0].offline || 0),
            pending: parseInt(pendingResult.rows[0].pending || 0),
            recent: parseInt(recentResult.rows[0].recent || 0)
        };

        console.log('Final stats:', stats);
        res.json(stats);

    } catch (error) {
        console.error('Error fetching site stats:', error);
        res.status(500).json({ 
            error: 'Failed to fetch site statistics', 
            details: error.message,
            siteName: req.params.siteName 
        });
    }
});

// Sync devices from inventory
router.post('/sync-from-inventory', authMiddleware, async (req, res) => {
    try {
        console.log('Starting inventory sync process');

        // Get unique vendors from device_inventory
        const getVendorsQuery = `
            SELECT DISTINCT 
                vendor,
                COUNT(*) as device_count,
                STRING_AGG(DISTINCT device_type, ', ') as device_types,
                MIN(created_at) as first_device_added,
                MAX(updated_at) as last_updated
            FROM device_inventory
            WHERE vendor IS NOT NULL
            GROUP BY vendor
            ORDER BY vendor
        `;

        const vendorsResult = await pool.query(getVendorsQuery);
        console.log(`Found ${vendorsResult.rows.length} vendors to sync`);

        // Get vendor device types breakdown
        const vendorTypesQuery = `
            SELECT 
                vendor,
                device_type,
                COUNT(*) as count
            FROM device_inventory
            WHERE vendor IS NOT NULL
            GROUP BY vendor, device_type
            ORDER BY vendor, device_type
        `;
        const typesResult = await pool.query(vendorTypesQuery);

        // Get sync summary
        const syncSummary = {
            totalVendors: vendorsResult.rows.length,
            vendorDetails: vendorsResult.rows,
            deviceTypesByVendor: typesResult.rows,
            lastSynced: new Date().toISOString()
        };

        res.json({
            success: true,
            message: 'Vendor sync completed successfully',
            summary: syncSummary,
            vendors: vendorsResult.rows
        });

    } catch (error) {
        console.error('Error syncing vendors:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to sync vendors',
            details: error.message
        });
    }
});

module.exports = router; 