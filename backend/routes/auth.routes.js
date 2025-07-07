const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { 
    login, 
    register, 
    logout, 
    verifySession,
    requestPasswordReset,
    resetPassword 
} = require('../controllers/auth.controller');
const { validateRequest } = require('../middleware/validate.middleware');
const { authenticateToken } = require('../middleware/auth.middleware');
const { pool } = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
// const { Pool } = require('pg');/

// Add this at the top of your routes file
router.get('/test', (req, res) => {
  res.json({ message: 'Auth API is working' });
});

// Validation middleware
const registerValidation = [
    body('username')
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters long'),
    body('email')
        .isEmail()
        .withMessage('Must be a valid email address'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    validateRequest
];

const loginValidation = [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest
];

// Registration route - update to include site assignment
router.post('/register', async (req, res) => {
  try {
    console.log('Register endpoint called with data:', {
      ...req.body,
      password: '[REDACTED]' // Don't log actual password
    });
    
    const { username, email, password, name, role = 'user', assigned_site } = req.body;

    // Validate input
    if (!username || !email || !password) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Username, email and password are required'
      });
    }

    // Check if user already exists
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userCheck.rows.length > 0) {
      console.log('User already exists with email or username');
      return res.status(409).json({
        success: false,
        message: 'User with that email or username already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Check if the role is valid
    const validRoles = ['user', 'manager', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Insert new user with site assignment if provided
    let query, params;
    if (assigned_site) {
      query = `
        INSERT INTO users (username, email, password_hash, full_name, role, assigned_site, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id, username, email, full_name as name, role, assigned_site
      `;
      params = [username, email, hashedPassword, name || username, role, assigned_site];
    } else {
      query = `
        INSERT INTO users (username, email, password_hash, full_name, role, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id, username, email, full_name as name, role
      `;
      params = [username, email, hashedPassword, name || username, role];
    }

    const newUser = await pool.query(query, params);

    console.log('User registered successfully:', newUser.rows[0].id);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error('Registration error on server:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration: ' + error.message
    });
  }
});

// Login route (existing)
router.post('/login', async (req, res) => {
  try {
    console.log('Login request received:', {
      email: req.body.email,
      password: '[REDACTED]'
    });

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check if user exists
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    console.log('User lookup result:', {
      found: userResult.rows.length > 0,
      // Don't log the whole user object for security
      fields: userResult.rows.length > 0 ? Object.keys(userResult.rows[0]) : []
    });

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = userResult.rows[0];

    // Compare password - add debugging
    console.log('Password comparison details:', {
      providedPassword: password.substring(0, 3) + '***', // Just show first 3 chars for security
      storedHash: user.password_hash.substring(0, 10) + '...',
      hashType: user.password_hash.startsWith('$2b$') ? 'bcrypt' : 'unknown'
    });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Remove password from response and prepare user object
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      assigned_site: user.assigned_site
    };

    console.log('Successful login, returning user:', userResponse);

    res.status(200).json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error details:', error);
    
    // More detailed error response
    res.status(500).json({
      success: false,
      message: 'Server error during login: ' + error.message,
      error: error.toString()
    });
  }
});

// For the reset password and user creation routes we added earlier
// Simplified password reset route
router.post('/simple-reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    // Check if user exists
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email address'
      });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password
    await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword, email]
    );

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
});

// Development only - create user directly
router.post('/create-user', async (req, res) => {
  try {
    const { email, password, name, role = 'user' } = req.body;
    
    // Check if user already exists
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with that email already exists'
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate a username from email if not provided
    const username = email.split('@')[0];
    
    // Insert new user
    const newUser = await pool.query(
      `INSERT INTO users (username, email, password, name, role, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, username, email, name, role`,
      [username, email, hashedPassword, name || username, role]
    );
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: newUser.rows[0]
      }
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during user creation'
    });
  }
});

router.post('/logout', authenticateToken, logout);
router.get('/verify', authenticateToken, verifySession);
router.post('/request-reset', 
    body('email').isEmail().withMessage('Valid email required'),
    validateRequest,
    requestPasswordReset
);
router.post('/reset-password',
    [
        body('token').notEmpty().withMessage('Reset token is required'),
        body('newPassword')
            .isLength({ min: 6 })
            .withMessage('New password must be at least 6 characters long'),
        validateRequest
    ],
    resetPassword
);

router.post('/dev-user-create', async (req, res) => {
    try {
        const { username, email, password, fullName } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email and password are required'
            });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert new user with admin role
        const result = await db.query(
            `INSERT INTO users (username, email, password_hash, full_name, role, status, created_at) 
             VALUES ($1, $2, $3, $4, 'admin', 'active', NOW()) 
             RETURNING id, username, email, full_name, role, status, created_at`,
            [username, email, passwordHash, fullName || '']
        );

        res.status(201).json({
            success: true,
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Dev user creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Add this debug endpoint
router.get('/status', (req, res) => {
  res.json({
    status: 'Auth service is running',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Add a debug endpoint to check user by ID
router.get('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const userResult = await pool.query(
      'SELECT id, username, email, role, full_name, assigned_site FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: userResult.rows[0]
    });
  } catch (error) {
    console.error('User lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 