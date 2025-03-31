const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, unique: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  vendorEmail: String, // Add this as a fallback
  // Other fields...
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema); 