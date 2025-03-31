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

// Simplified admin registration (only for development purposes)
router.post('/register-admin', async (req, res) => {
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
    console.error('Admin registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Routes
router.post('/register', registerValidation, register);
router.post('/login', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!password || (!username && !email)) {
            return res.status(400).json({ error: 'Username/email and password are required' });
        }
        
        // Find user by username or email
        let query, params;
        if (username) {
            query = 'SELECT id, username, email, password_hash, role, status, assigned_site FROM users WHERE username = $1';
            params = [username];
        } else {
            query = 'SELECT id, username, email, password_hash, role, status, assigned_site FROM users WHERE email = $1';
            params = [email];
        }
        
        console.log('Executing query:', query, 'with params:', params);
        const result = await pool.query(query, params);
        
        if (result.rows.length === 0) {
            console.log('No user found with provided credentials');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = result.rows[0];
        console.log('User found:', { id: user.id, username: user.username, role: user.role });
        
        // Check if user is active
        if (user.status !== 'active') {
            console.log('User account is inactive');
            return res.status(401).json({ error: 'Account is inactive. Please contact an administrator.' });
        }
        
        // Check password
        console.log('Comparing password...');
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            console.log('Password does not match');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        console.log('Password matched, generating token');
        
        // Create and return JWT token
        const token = jwt.sign(
            { 
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                assigned_site: user.assigned_site
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        // Update last login time
        await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
        
        // Return user info and token
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                assigned_site: user.assigned_site
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
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

module.exports = router; 