const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../database/schema');
const authMiddleware = require('../middleware/auth');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory:', uploadsDir);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads/invoices');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, `invoice-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Error handling for multer file uploads
const fileFilter = (req, file, cb) => {
  // Accept only PDF files
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Custom middleware to handle multer errors
const handleUpload = (req, res, next) => {
  console.log('Starting file upload process...');
  
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds 10MB limit'
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
router.get('/invoices', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT 
        i.*,
        s.name as vendor
      FROM invoices i
      LEFT JOIN suppliers s ON i.vendor_id = s.id
      ORDER BY i.extraction_date DESC
    `;
    
    const result = await pool.query(query);
    
    // Transform the data to include file URLs
    const invoices = result.rows.map(invoice => ({
      ...invoice,
      fileUrl: `${req.protocol}://${req.get('host')}/api/invoices/${invoice.id}/file`
    }));
    
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices', details: error.message });
  }
});

// Get a specific invoice file
router.get('/invoices/:id/file', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'SELECT file_path, filename FROM invoices WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const { file_path, filename } = result.rows[0];
    
    // Check if file exists
    if (!fs.existsSync(file_path)) {
      return res.status(404).json({ error: 'Invoice file not found' });
    }
    
    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(file_path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error fetching invoice file:', error);
    res.status(500).json({ error: 'Failed to fetch invoice file', details: error.message });
  }
});

// Upload a new invoice manually
router.post('/invoices', authMiddleware, upload.single('invoiceFile'), async (req, res) => {
  try {
    const { vendor_id, invoice_number, invoice_date, amount } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No invoice file uploaded' });
    }
    
    const query = `
      INSERT INTO invoices (
        filename, 
        file_path, 
        vendor_id, 
        invoice_number, 
        invoice_date, 
        amount, 
        status, 
        extraction_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;
    
    const values = [
      file.originalname,
      file.path,
      vendor_id || null,
      invoice_number || null,
      invoice_date || null,
      amount || null,
      'pending'
    ];
    
    const result = await pool.query(query, values);
    
    res.status(201).json({
      message: 'Invoice uploaded successfully',
      invoice: result.rows[0]
    });
  } catch (error) {
    console.error('Error uploading invoice:', error);
    res.status(500).json({ error: 'Failed to upload invoice', details: error.message });
  }
});

module.exports = router; 