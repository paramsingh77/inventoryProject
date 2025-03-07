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

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
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