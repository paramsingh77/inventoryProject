const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

// Initialize Python script path
const PYTHON_SCRIPT = path.join(__dirname, '../scripts/product_analyzer.py');

// Ensure Python environment is set up
async function setupPythonEnv() {
  try {
    const requirementsPath = path.join(__dirname, '../scripts/requirements.txt');
    await execAsync(`pip install -r ${requirementsPath}`);
  } catch (error) {
    console.error('Error setting up Python environment:', error);
    throw error;
  }
}

// Search products endpoint
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Run Python script as a child process
    const pythonProcess = spawn('python3', [PYTHON_SCRIPT, '--query', query]);
    
    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python script error:', errorData);
        return res.status(500).json({ 
          error: 'Failed to search products',
          details: errorData
        });
      }

      try {
        const products = JSON.parse(outputData);
        res.json(products);
      } catch (error) {
        console.error('Error parsing Python script output:', error);
        res.status(500).json({ 
          error: 'Failed to parse search results',
          details: error.message
        });
      }
    });

  } catch (error) {
    console.error('Search endpoint error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Get product details endpoint
router.get('/product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Run Python script to get product details
    const pythonProcess = spawn('python3', [PYTHON_SCRIPT, '--product-id', id]);
    
    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python script error:', errorData);
        return res.status(500).json({ 
          error: 'Failed to get product details',
          details: errorData
        });
      }

      try {
        const productDetails = JSON.parse(outputData);
        res.json(productDetails);
      } catch (error) {
        console.error('Error parsing Python script output:', error);
        res.status(500).json({ 
          error: 'Failed to parse product details',
          details: error.message
        });
      }
    });

  } catch (error) {
    console.error('Product details endpoint error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Initialize Python environment when the server starts
setupPythonEnv().catch(console.error);

module.exports = router; 