const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parse');
const { 
    checkCsvFileExists, 
    storeCsvFile, 
    getCsvFile, 
    listTables,
    initializeSchema,
    storeCsvDataToInventory 
} = require('../database/schema');

// Configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        // Accept csv files and text files that might be csv
        if (file.mimetype === 'text/csv' || 
            file.mimetype === 'application/csv' ||
            file.mimetype === 'text/plain' ||
            file.mimetype === 'application/vnd.ms-excel' ||
            file.originalname.toLowerCase().endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Check if CSV exists
router.get('/check/:filename', async (req, res) => {
    try {
        const exists = await checkCsvFileExists(req.params.filename);
        res.json({ exists });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload CSV file
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileData = {
            filename: req.file.originalname,
            originalName: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype,
            buffer: req.file.buffer,
            metadata: {
                uploadedBy: req.user?.id || 'anonymous',
                uploadDate: new Date().toISOString()
            }
        };

        const fileId = await storeCsvFile(fileData);
        res.json({ 
            success: true, 
            fileId,
            message: 'File uploaded successfully' 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Download CSV file
router.get('/download/:filename', async (req, res) => {
    try {
        const file = await getCsvFile(req.params.filename);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.setHeader('Content-Type', file.mime_type);
        res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
        res.send(file.file_data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check database tables
router.get('/check-tables', async (req, res) => {
    try {
        const tables = await listTables();
        res.json({ 
            success: true,
            tables: tables.map(row => row.table_name)
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Manually initialize schema
router.post('/init-schema', async (req, res) => {
    try {
        await initializeSchema();
        const tables = await listTables();
        res.json({ 
            success: true,
            message: 'Schema initialized successfully',
            tables: tables.map(row => row.table_name)
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Process and store CSV data
router.post('/process', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        // Parse CSV file
        const records = [];
        const parser = csv.parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relaxColumnCount: true,  // Allow varying column counts
            relaxQuotes: true,       // Be more forgiving of quotes
            delimiter: ',',          // Explicitly set delimiter
        });

        // Process each row
        parser.on('readable', function() {
            let record;
            while ((record = parser.read()) !== null) {
                // Clean up the record object
                const cleanRecord = {};
                for (const [key, value] of Object.entries(record)) {
                    // Remove BOM and clean up key names
                    const cleanKey = key.replace(/^\uFEFF/, '').trim().toLowerCase();
                    cleanRecord[cleanKey] = value;
                }
                records.push(cleanRecord);
            }
        });

        // Handle parsing completion
        const processData = new Promise((resolve, reject) => {
            parser.on('end', () => resolve(records));
            parser.on('error', reject);
        });

        // Feed the parser with file data
        parser.write(req.file.buffer);
        parser.end();

        // Wait for parsing to complete
        const parsedRecords = await processData;

        console.log('Parsed records:', parsedRecords.slice(0, 2)); // Log first two records for debugging

        // Store the data in device_inventory table
        const result = await storeCsvDataToInventory(parsedRecords);

        res.json({
            success: true,
            message: `Successfully processed ${result.insertedRows} records`,
            details: result
        });

    } catch (error) {
        console.error('Error processing CSV:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router; 