const express = require('express');
const app = express();
const cors = require('cors');

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');

// Mount routes - this is critical
app.use('/api/purchase-orders', purchaseOrderRoutes);

// Test route to verify server is working
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 