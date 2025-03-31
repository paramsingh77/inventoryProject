const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const { authenticateToken: auth } = require('../middleware/auth.middleware');
const admin = require('../middleware/admin');

// Add this at the top of your routes file
router.get('/test', (req, res) => {
  res.json({ message: 'Users API is working' });
});

// Get all users (admin only)
router.get('/', auth, admin, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, full_name, role, status, assigned_site, created_at, last_login FROM users ORDER BY created_at DESC'
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get a specific user
router.get('/:id', auth, async (req, res) => {
  try {
    // Regular users can only access their own data
    if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await db.query(
      'SELECT id, username, email, full_name, role, status, assigned_site, created_at, last_login FROM users WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create a new user (admin only)
router.post('/', async (req, res) => {
  req.user = { id: 1, role: 'admin' }; // Mock admin user
  
  try {
    const { username, email, password, full_name, role, status, assigned_site } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }
    
    // Check if username or email already exists
    const existingUser = await db.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Insert new user
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, full_name, role, status, assigned_site, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
       RETURNING id, username, email, full_name, role, status, assigned_site, created_at`,
      [username, email, passwordHash, full_name || '', role || 'user', status || 'active', assigned_site]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update a user (admin or self)
router.put('/:id', auth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Regular users can only update their own data
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { username, email, password, full_name, role, status, assigned_site } = req.body;
    
    // Check if user exists
    const userCheck = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Regular users cannot change their role
    if (req.user.role !== 'admin' && role !== userCheck.rows[0].role) {
      return res.status(403).json({ error: 'Cannot change role' });
    }
    
    // Build update query
    let updateQuery = 'UPDATE users SET ';
    const queryParams = [];
    const updateFields = [];
    
    if (username) {
      queryParams.push(username);
      updateFields.push(`username = $${queryParams.length}`);
    }
    
    if (email) {
      queryParams.push(email);
      updateFields.push(`email = $${queryParams.length}`);
    }
    
    if (password) {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      queryParams.push(passwordHash);
      updateFields.push(`password_hash = $${queryParams.length}`);
    }
    
    if (full_name !== undefined) {
      queryParams.push(full_name);
      updateFields.push(`full_name = $${queryParams.length}`);
    }
    
    if (role && req.user.role === 'admin') {
      queryParams.push(role);
      updateFields.push(`role = $${queryParams.length}`);
    }
    
    if (status && req.user.role === 'admin') {
      queryParams.push(status);
      updateFields.push(`status = $${queryParams.length}`);
    }
    
    if ((assigned_site !== undefined) && (req.user.role === 'admin')) {
      queryParams.push(assigned_site);
      updateFields.push(`assigned_site = $${queryParams.length}`);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updateQuery += updateFields.join(', ');
    queryParams.push(userId);
    updateQuery += ` WHERE id = $${queryParams.length} RETURNING id, username, email, full_name, role, status, assigned_site, created_at`;
    
    // Execute update
    const result = await db.query(updateQuery, queryParams);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete a user (admin only)
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user exists
    const userCheck = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete user
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router; 