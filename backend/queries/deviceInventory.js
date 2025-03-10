const { Pool } = require('pg');
const pool = new Pool({
    // Your database configuration
});

// Function to import CSV data
const importCSVData = async (data) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const queryText = `
            INSERT INTO device_inventory (
                site_name, device_hostname, device_description, 
                last_user, last_seen, device_type, device_model,
                operating_system, serial_number, device_cpu, mac_addresses
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;

        for (const row of data) {
            // Convert MAC addresses string to array
            const macAddresses = row['MAC Address(es)']
                .replace(/[\[\]"]/g, '')
                .split(',')
                .map(mac => mac.trim())
                .filter(mac => mac);

            // Convert "Currently Online" to current timestamp
            const lastSeen = row['Last Seen'] === 'Currently Online' 
                ? new Date() 
                : new Date(row['Last Seen']);

            await client.query(queryText, [
                row['Site Name'],
                row['Device Hostname'],
                row['Device Description'],
                row['Last User'],
                lastSeen,
                row['Device Type'],
                row['Device Model'],
                row['Operating System'],
                row['Serial Number'],
                row['Device CPU'],
                macAddresses
            ]);
        }

        await client.query('COMMIT');
        return { success: true, message: 'Data imported successfully' };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Function to fetch devices with filtering and pagination
const getDevices = async ({ 
    page = 1, 
    limit = 50, 
    sortBy = 'site_name', 
    sortOrder = 'ASC',
    filters = {} 
}) => {
    const offset = (page - 1) * limit;
    let queryParams = [limit, offset];
    let filterConditions = [];
    let paramCounter = 3;

    // Build filter conditions
    if (filters.siteName) {
        filterConditions.push(`site_name ILIKE $${paramCounter}`);
        queryParams.push(`%${filters.siteName}%`);
        paramCounter++;
    }
    if (filters.deviceType) {
        filterConditions.push(`device_type = $${paramCounter}`);
        queryParams.push(filters.deviceType);
        paramCounter++;
    }
    // Add more filters as needed

    const whereClause = filterConditions.length 
        ? 'WHERE ' + filterConditions.join(' AND ')
        : '';

    const queryText = `
        SELECT *
        FROM device_inventory
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $1 OFFSET $2
    `;

    const countText = `
        SELECT COUNT(*)
        FROM device_inventory
        ${whereClause}
    `;

    const client = await pool.connect();
    try {
        const [data, count] = await Promise.all([
            client.query(queryText, queryParams),
            client.query(countText, filterConditions.length ? queryParams.slice(2) : [])
        ]);

        return {
            devices: data.rows,
            total: parseInt(count.rows[0].count),
            totalPages: Math.ceil(parseInt(count.rows[0].count) / limit),
            currentPage: page
        };
    } finally {
        client.release();
    }
};

// Additional CRUD functions
const addDevice = async (deviceData) => {
    // Implementation for adding a single device
};

const updateDevice = async (id, deviceData) => {
    // Implementation for updating a device
};

const deleteDevice = async (id) => {
    // Implementation for deleting a device
};

module.exports = {
    importCSVData,
    getDevices,
    addDevice,
    updateDevice,
    deleteDevice
}; 