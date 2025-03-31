const db = require('../db');
const { generateToken } = require('../utils/jwt.utils');
const { comparePassword } = require('../utils/password.utils');
const crypto = require('crypto');
const { hashPassword } = require('../utils/password.utils');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const login = async (req, res) => {
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
    const result = await db.query(query, params);
    
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
    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    
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
};

// Optional: Add a function to verify if the token is still valid
const verifySession = async (req, res) => {
  try {
    // The user object is attached by the auth middleware
    const { id, roles } = req.user;

    const userQuery = `
      SELECT 
        u.id,
        u.username,
        u.email,
        r.name as role_name,
        s.id as site_id,
        s.name as site_name,
        s.location as site_location,
        s.image_url as site_image,
        s.is_active as site_active
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      LEFT JOIN sites s ON ur.site_id = s.id
      WHERE u.id = $1
    `;

    const userResult = await db.query(userQuery, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    const response = {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role_name
      }
    };

    if (user.role_name === 'admin') {
      const sitesQuery = `
        SELECT 
          id,
          name,
          location,
          image_url,
          is_active
        FROM sites
        WHERE is_active = true
        ORDER BY name
      `;
      
      const sitesResult = await db.query(sitesQuery);
      response.sites = sitesResult.rows;
      response.redirectTo = '/sites';
    } else {
      response.site = {
        id: user.site_id,
        name: user.site_name,
        location: user.site_location,
        image_url: user.site_image
      };
      response.redirectTo = `/dashboard/${user.site_id}`;
    }

    res.json(response);

  } catch (error) {
    console.error('Session verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout (blacklist token)
const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      // Store token in blacklist with expiry
      await db.query(
        'INSERT INTO token_blacklist (token, expires_at) VALUES ($1, NOW() + INTERVAL \'1 day\')',
        [token]
      );
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await db.query('SELECT id, email FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await hashPassword(resetToken);

    // Store reset token
    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = NOW() + INTERVAL \'1 hour\' WHERE id = $2',
      [resetTokenHash, user.rows[0].id]
    );

    // In production, send email with reset link
    // For testing, we'll return the token
    res.json({ 
      success: true, 
      message: 'Reset instructions sent to email',
      resetToken // Remove this in production
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await db.query(
      'SELECT id FROM users WHERE reset_token_expires > NOW()',
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const hashedPassword = await hashPassword(newPassword);
    await db.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashedPassword, user.rows[0].id]
    );

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Register new user
const register = async (req, res) => {
  try {
    const { username, email, password, full_name, role = 'user', status = 'active', assigned_site } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email and password are required'
      });
    }
    
    // Check if username or email already exists
    // Use db.query instead of pool.query
    const existingUser = await db.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists'
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Insert new user
    // Use db.query instead of pool.query
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, full_name, role, status, assigned_site, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
       RETURNING id, username, email, full_name, role, status, assigned_site, created_at`,
      [username, email, passwordHash, full_name || '', role, status, assigned_site]
    );
    
    res.status(201).json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const sendEmail = async (recipient, subject, content) => {
  // Skip email sending if explicitly disabled
  if (process.env.ENABLE_EMAIL === 'false') {
    console.log('Email sending disabled by configuration');
    console.log(`Would have sent email to: ${recipient}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${content}`);
    return true;
  }
  
  try {
    // Create transporter using actual credentials from .env
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"System" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject: subject,
      html: content
    });
    
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = {
  login,
  verifySession,
  logout,
  requestPasswordReset,
  resetPassword,
  register
}; 