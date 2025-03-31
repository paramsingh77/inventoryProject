const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Use your Railway.app DB_URL
    ssl: {
        rejectUnauthorized: false // This is often needed for cloud databases
    }
});

// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.connect();
        console.log('Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
};

// Execute test connection
testConnection();

module.exports = { pool, testConnection }; 