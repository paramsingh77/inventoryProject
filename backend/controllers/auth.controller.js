const pool = require('../config/db.config');
const { generateToken } = require('../utils/jwt.utils');
const { comparePassword } = require('../utils/password.utils');
const crypto = require('crypto');
const { hashPassword } = require('../utils/password.utils');

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Get user with role and site information
    const userQuery = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.password_hash,
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
      WHERE u.username = $1
    `;

    const userResult = await pool.query(userQuery, [username]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    const user = userResult.rows[0];

    // Verify password
    const validPassword = await comparePassword(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = generateToken(user.id, [user.role_name]);

    // Prepare base response
    const response = {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role_name
      }
    };

    // Handle different roles
    if (user.role_name === 'admin') {
      // For admin, fetch all active sites
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
      
      const sitesResult = await pool.query(sitesQuery);
      response.sites = sitesResult.rows;
      response.redirectTo = '/sites'; // Frontend will redirect to sites page
    } else {
      // For regular users, only include their assigned site
      if (!user.site_id || !user.site_active) {
        return res.status(403).json({
          success: false,
          message: 'No active site assigned to user'
        });
      }

      response.site = {
        id: user.site_id,
        name: user.site_name,
        location: user.site_location,
        image_url: user.site_image
      };
      response.redirectTo = `/dashboard/${user.site_id}`; // Frontend will redirect to specific site dashboard
    }

    res.json(response);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
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

    const userResult = await pool.query(userQuery, [id]);

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
      
      const sitesResult = await pool.query(sitesQuery);
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
      await pool.query(
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
    const user = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await hashPassword(resetToken);

    // Store reset token
    await pool.query(
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
    const user = await pool.query(
      'SELECT id FROM users WHERE reset_token_expires > NOW()',
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const hashedPassword = await hashPassword(newPassword);
    await pool.query(
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
  const { username, email, password, role = 'user', siteId = null } = req.body;
  
  try {
    // Start transaction
    await pool.query('BEGIN');

    // Check if username or email exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: 'Username or email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert user
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [username, email, hashedPassword]
    );

    // Get role id
    const roleResult = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      [role]
    );

    // Assign role and site
    await pool.query(
      'INSERT INTO user_roles (user_id, role_id, site_id) VALUES ($1, $2, $3)',
      [newUser.rows[0].id, roleResult.rows[0].id, siteId]
    );

    await pool.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'User registered successfully'
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
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