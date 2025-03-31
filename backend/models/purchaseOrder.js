const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'sent'],
    default: 'draft'
  },
  supplier: {
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    email: String
  },
  orderedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  items: [{
    productId: mongoose.Schema.Types.ObjectId,
    name: String,
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  notes: String,
  orderDate: {
    type: Date,
    default: Date.now
  },
  expectedDelivery: Date,
  shippingStatus: String,
  trackingNumber: String,
  currentLocation: String,
  lastStatusUpdate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
purchaseOrderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

module.exports = PurchaseOrder; 