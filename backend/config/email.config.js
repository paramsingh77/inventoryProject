/**
 * Email configuration
 */
const nodemailer = require('nodemailer');

// Create reusable transporter with proper configuration
// For development, use a test account or disable emails
const transporter = process.env.NODE_ENV === 'development' 
  ? nodemailer.createTransport({
      host: 'smtp.ethereal.email', // Ethereal is a fake SMTP service for testing
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'ethereal_test_user',
        pass: process.env.SMTP_PASS || 'ethereal_test_password'
      }
    })
  : nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

module.exports = transporter; 