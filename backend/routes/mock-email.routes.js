/**
 * Mock Email Routes
 * 
 * These routes simulate email functionality without requiring actual email credentials.
 * They provide console logs for visual feedback in the terminal.
 */

const express = require('express');
const router = express.Router();
const mockEmailController = require('../controllers/mock-email.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory:', uploadsDir);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads (same as in invoice.routes.js)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Error handling for multer file uploads
const fileFilter = (req, file, cb) => {
  // Accept only PDF files
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: fileFilter
}).single('pdfFile');

// Custom middleware to handle multer errors
const handleUpload = (req, res, next) => {
  console.log('Starting mock file upload process...');
  
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds 50MB limit'
        });
      }
      return res.status(400).json({
        success: false,
        message: `File upload error: ${err.message}`
      });
    } else if (err) {
      // An unknown error occurred
      console.error('Unknown upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    // Log successful upload
    if (req.file) {
      console.log(`File uploaded successfully: ${req.file.originalname} (${req.file.size} bytes)`);
    } else {
      console.warn('No file was uploaded, but no error was thrown');
    }
    
    // Everything went fine
    next();
  });
};

// Routes
// Add a simple health check endpoint
router.get('/mock/health', (req, res) => {
  console.log('\n🏥 MOCK HEALTH CHECK 🏥');
  console.log('----------------------------------');
  console.log('✅ Backend is running in mock mode');
  console.log(`⏱️ Server time: ${new Date().toISOString()}`);
  console.log('----------------------------------\n');
  
  res.json({
    status: 'ok',
    mode: 'mock',
    timestamp: new Date().toISOString(),
    message: 'Mock backend server is running'
  });
});

// Route to send a purchase order via email (mock)
router.post('/mock/email/send-po', mockEmailController.sendPurchaseOrderEmail);

// Route to send a purchase order via email with uploaded PDF (mock)
router.post('/mock/email/send-po-with-file', handleUpload, mockEmailController.sendPurchaseOrderWithPdf);

// Route to manually check for new emails with invoices (mock)
router.get('/mock/email/check', mockEmailController.checkEmails);

// Invoice routes (mock)
router.get('/mock/invoices', mockEmailController.getInvoices);
router.get('/mock/invoices/:invoiceId', mockEmailController.getInvoiceById);
router.post('/mock/invoices/:invoiceId/link', mockEmailController.linkInvoiceToPO);

module.exports = router; 