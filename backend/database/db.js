const { Pool } = require('pg');
require('dotenv').config();

// Create a singleton pool instance
let pool = null;

function createPool() {
  if (pool) return pool;
  
  try {
    console.log('Creating database pool with URL:', process.env.DATABASE_URL);
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      // Don't crash the server, just log the error
    });

    console.log('Database pool created successfully');
    return pool;
  } catch (error) {
    console.error('Error creating pool:', error);
    return null;
  }
}

// Create the pool immediately
const dbPool = createPool();

// Test the connection
if (dbPool) {
  dbPool.connect((err, client, release) => {
    if (err) {
      console.error('Error connecting to the database:', err.stack);
    } else {
      console.log('Successfully connected to database');
      client.query('SELECT NOW()', (err, result) => {
        release();
        if (err) {
          console.error('Error executing test query:', err.stack);
        } else {
          console.log('Database connection test successful:', result.rows[0]);
        }
      });
    }
  });
} else {
  console.error('Failed to create database pool');
}

// For mock data in development
const getMockSuppliers = () => {
  return [
    { 
      id: 1, 
      name: 'Acme Supplies', 
      contact_person: 'John Doe',
      email: 'john@acmesupplies.com',
      phone: '555-123-4567',
      address: '123 Main St, San Francisco, CA 94105',
      website: 'www.acmesupplies.com',
      tax_id: 'TAX123456',
      payment_terms: 'Net 30',
      status: 'active',
      category: 'hardware',
      notes: 'Good supplier for hardware items',
      rating: 4,
      last_order_date: '2023-01-15'
    },
    // More mock suppliers...
  ];
};

// Safe query method that handles connection errors gracefully
const safeQuery = async (text, params = []) => {
  try {
    // Check if pool is initialized
    if (!dbPool) {
      throw new Error('Database pool is not initialized');
    }
    
    // Try to execute the query
    const result = await dbPool.query(text, params);
    return result;
  } catch (error) {
    console.error(`Database query error: ${error.message}`);
    console.error(`Query: ${text}`);
    console.error(`Params: ${JSON.stringify(params)}`);
    
    // Rethrow the error with additional context
    throw new Error(`Database error: ${error.message}`);
  }
};

module.exports = {
  pool: dbPool,
  safeQuery,
  getMockSuppliers
}; 