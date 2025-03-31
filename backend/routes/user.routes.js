const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const bcrypt = require('bcrypt');
const auth = require('../middleware/auth');
const adminCheck = require('../middleware/adminCheck');

// Get all users (admin only)
router.get('/', auth, adminCheck, async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.role, 
        u.status, 
        u.assigned_site, 
        u.full_name, 
        u.last_login,
        u.created_at
      FROM 
        users u
      ORDER BY 
        u.full_name, u.username
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user details for current user
router.get('/me', auth, async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        username, 
        email, 
        role, 
        status, 
        assigned_site, 
        full_name, 
        last_login, 
        created_at
      FROM 
        users
      WHERE 
        id = $1
    `;
    
    const result = await pool.query(query, [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Create new user (admin only)
router.post('/', auth, adminCheck, async (req, res) => {
  try {
    // Log the entire request for debugging
    console.log('==== CREATE USER REQUEST ====');
    console.log('Headers:', req.headers);
    console.log('Body:', { ...req.body, password: '[REDACTED]' });
    console.log('User making request:', req.user);
    
    const { username, email, password, role, status, assigned_site, full_name } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ error: 'Username, email and password are required' });
    }
    
    // Log each step of the process
    console.log('Step 1: Checking for existing email');
    const checkEmail = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (checkEmail.rows.length > 0) {
      console.log('Validation failed: Email already exists');
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    console.log('Step 2: Checking for existing username');
    const checkUsername = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (checkUsername.rows.length > 0) {
      console.log('Validation failed: Username already taken');
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    console.log('Step 3: Hashing password');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('Step 4: Checking table structure');
    // Check table structure
    try {
      const tableInfo = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
      `);
      console.log('Users table structure:', tableInfo.rows);
      
      // Check if password_hash column exists
      const hasPasswordHash = tableInfo.rows.some(col => col.column_name === 'password_hash');
      if (!hasPasswordHash) {
        console.log('Adding password_hash column');
        await pool.query('ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)');
      }
      
      // Add other missing columns
      const columns = {
        'role': 'VARCHAR(20) DEFAULT \'user\'',
        'status': 'VARCHAR(20) DEFAULT \'active\'',
        'assigned_site': 'VARCHAR(100)',
        'full_name': 'VARCHAR(100)',
        'last_login': 'TIMESTAMP',
        'created_at': 'TIMESTAMP DEFAULT NOW()',
        'updated_at': 'TIMESTAMP'
      };
      
      for (const [colName, colType] of Object.entries(columns)) {
        const hasColumn = tableInfo.rows.some(col => col.column_name === colName);
        if (!hasColumn) {
          console.log(`Adding ${colName} column`);
          await pool.query(`ALTER TABLE users ADD COLUMN ${colName} ${colType}`);
        }
      }
    } catch (error) {
      console.error('Error checking/updating table structure:', error);
      // Continue anyway
    }
    
    console.log('Step 5: Preparing insert query');
    // Insert user with all fields
    const query = `
      INSERT INTO users (
        username, 
        email, 
        password_hash, 
        role, 
        status, 
        assigned_site, 
        full_name,
        created_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
      RETURNING id, username, email, role, status, assigned_site, full_name, created_at
    `;
    
    const values = [
      username,
      email,
      hashedPassword,
      role || 'user',
      status || 'active',
      role === 'admin' ? null : assigned_site,
      full_name || ''
    ];
    
    console.log('Query:', query);
    console.log('Values:', [...values.slice(0, 2), '[REDACTED]', ...values.slice(3)]);
    
    console.log('Step 6: Executing insert query');
    const result = await pool.query(query, values);
    console.log('User created successfully:', result.rows[0]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('==== CREATE USER ERROR ====');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    // Check for specific PostgreSQL errors
    if (error.code === '42P01') {
      console.error('Table "users" does not exist, creating it');
      try {
        await pool.query(`
          CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) DEFAULT 'user',
            status VARCHAR(20) DEFAULT 'active',
            assigned_site VARCHAR(100),
            full_name VARCHAR(100),
            last_login TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP
          )
        `);
        // Try again after creating table
        return res.status(500).json({ 
          error: 'Users table was missing and has been created. Please try again.',
          details: error.message
        });
      } catch (createError) {
        console.error('Failed to create users table:', createError);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to create user',
      details: error.message,
      code: error.code
    });
  }
});

// Update user (admin only)
router.put('/:id', auth, adminCheck, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, role, status, assigned_site, full_name } = req.body;
    
    // Verify user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if updating to an existing email
    if (email) {
      const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email already in use by another user' });
      }
    }
    
    // Check if updating to an existing username
    if (username) {
      const usernameCheck = await pool.query('SELECT * FROM users WHERE username = $1 AND id != $2', [username, id]);
      if (usernameCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Username already in use by another user' });
      }
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (username) {
      updates.push(`username = $${paramIndex}`);
      values.push(username);
      paramIndex++;
    }
    
    if (email) {
      updates.push(`email = $${paramIndex}`);
      values.push(email);
      paramIndex++;
    }
    
    if (password) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updates.push(`password_hash = $${paramIndex}`);
      values.push(hashedPassword);
      paramIndex++;
    }
    
    if (role) {
      updates.push(`role = $${paramIndex}`);
      values.push(role);
      paramIndex++;
    }
    
    if (status) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }
    
    // For assigned_site, set it to null if role is admin
    if (role === 'admin' || assigned_site !== undefined) {
      updates.push(`assigned_site = $${paramIndex}`);
      values.push(role === 'admin' ? null : assigned_site);
      paramIndex++;
    }
    
    if (full_name) {
      updates.push(`full_name = $${paramIndex}`);
      values.push(full_name);
      paramIndex++;
    }
    
    // Add updated_at timestamp
    updates.push(`updated_at = NOW()`);
    
    // If no updates, return early
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }
    
    // Build and execute the query
    const query = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING id, username, email, role, status, assigned_site, full_name, created_at
    `;
    
    values.push(id);
    const result = await pool.query(query, values);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, adminCheck, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't allow deleting your own account
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Delete the user
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Alternative: Get sites from an existing source if there's no dedicated sites table
router.get('/sites', auth, adminCheck, async (req, res) => {
  try {
    console.log('Fetching sites for user assignment dropdown');
    
    // Try to query from device_inventory table for sites/locations
    const query = `
      SELECT DISTINCT 
        location as name,
        location as id
      FROM 
        device_inventory
      WHERE 
        location IS NOT NULL AND location != ''
      ORDER BY 
        location
    `;
    
    const result = await pool.query(query);
    console.log(`Found ${result.rows.length} sites/locations`);
    
    if (result.rows.length === 0) {
      // Return mock data if no sites found
      return res.json([
        { id: 1, name: 'Main Hospital' },
        { id: 2, name: 'North Wing' },
        { id: 3, name: 'South Wing' },
        { id: 4, name: 'East Wing' },
        { id: 5, name: 'West Wing' }
      ]);
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching site names:', error);
    // Return mock data on error
    res.json([
      { id: 1, name: 'Main Hospital' },
      { id: 2, name: 'North Wing' },
      { id: 3, name: 'South Wing' },
      { id: 4, name: 'East Wing' },
      { id: 5, name: 'West Wing' }
    ]);
  }
});

// Test database connection
router.get('/test-db', async (req, res) => {
  try {
    console.log('Testing database connection');
    const result = await pool.query('SELECT NOW() as time');
    console.log('Database connection successful:', result.rows[0]);
    res.json({ 
      status: 'success', 
      message: 'Database connection successful',
      time: result.rows[0].time
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Simple user creation for testing
router.post('/test-create', auth, adminCheck, async (req, res) => {
  try {
    console.log('Testing simple user creation');
    
    // Generate a random username to avoid conflicts
    const testUsername = 'test_' + Math.floor(Math.random() * 10000);
    const testEmail = `${testUsername}@example.com`;
    
    // Simple insert with minimal fields
    const query = `
      INSERT INTO users (username, email, password_hash) 
      VALUES ($1, $2, $3) 
      RETURNING id, username, email
    `;
    
    const result = await pool.query(query, [
      testUsername,
      testEmail,
      'test_hash_not_for_login'
    ]);
    
    console.log('Test user created:', result.rows[0]);
    res.status(201).json({
      status: 'success',
      message: 'Test user created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Test user creation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Test user creation failed',
      error: error.message,
      code: error.code
    });
  }
});

module.exports = router; 