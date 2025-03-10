const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, '../files/temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure directory exists
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (error) {
      console.error('Error creating upload directory:', error);
      cb(error, null);
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const originalName = path.parse(file.originalname).name;
    const filename = `po-${originalName}-${timestamp}.pdf`;
    cb(null, filename);
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
  limits: { fileSize: 50 * 1024 * 1024 }, // Increase to 50MB limit
  fileFilter: fileFilter
}).single('pdfFile');

// Custom middleware to handle multer errors
const handleUpload = (req, res, next) => {
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
    // Everything went fine
    next();
  });
};

// Routes
// Add a simple health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Backend server is running'
  });
});

// Add simple test endpoint for upload diagnostics
router.post('/email/test-upload', handleUpload, (req, res) => {
  try {
    console.log('Test upload received:');
    console.log('- File:', req.file ? req.file.originalname : 'No file received');
    console.log('- Fields:', req.body);
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file received in test upload'
      });
    }
    
    // Return success with file details
    res.json({
      success: true,
      message: 'Test upload successful',
      file: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      },
      fields: req.body
    });
  } catch (error) {
    console.error('Error in test upload:', error);
    res.status(500).json({
      success: false,
      message: 'Test upload failed',
      error: error.message
    });
  }
});

// Route to send a purchase order via email
router.post('/email/send-po', emailController.sendPurchaseOrderEmail);

// Route to send a purchase order via email with uploaded PDF
router.post('/email/send-po-with-file', handleUpload, emailController.sendPurchaseOrderWithPdf);

// Route to manually check for new emails with invoices
router.get('/email/check', emailController.checkEmails);

// Invoice routes
router.get('/invoices', emailController.getInvoices);
router.get('/invoices/:invoiceId', emailController.getInvoiceById);
router.post('/invoices/:invoiceId/link', emailController.linkInvoiceToPO);

module.exports = router; 