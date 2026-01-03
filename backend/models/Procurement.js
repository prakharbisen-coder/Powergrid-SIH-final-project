const mongoose = require('mongoose');

const procurementSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide quantity'],
    min: [1, 'Quantity must be at least 1']
  },
  vendor: {
    name: {
      type: String,
      required: true
    },
    contactPerson: String,
    email: String,
    phone: String,
    address: String
  },
  pricing: {
    unitPrice: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    tax: Number,
    discount: Number,
    finalAmount: Number
  },
  // Tax and location details
  originState: {
    type: String
  },
  deliveryState: {
    type: String
  },
  isImported: {
    type: Boolean,
    default: false
  },
  distance: {
    type: Number,
    default: 0
  },
  weight: {
    type: Number
  },
  vehicleType: {
    type: String,
    enum: ['standard', 'express', 'special'],
    default: 'standard'
  },
  additionalCharges: {
    type: Number,
    default: 0
  },
  // Detailed tax breakdown
  taxBreakdown: {
    customDuty: {
      material: String,
      isImported: Boolean,
      customDutyRate: Number,
      customDutyAmount: Number,
      assessableValue: Number
    },
    gst: {
      type: String,
      originState: String,
      destState: String,
      cgst: Number,
      sgst: Number,
      igst: Number,
      totalGST: Number
    },
    stateTaxes: {
      state: String,
      sgst: Number,
      cgst: Number,
      cess: Number,
      vat: Number,
      additionalTax: Number,
      totalStateTax: Number
    },
    transport: {
      distance: Number,
      weight: Number,
      vehicleType: String,
      baseCost: Number,
      gst: Number,
      totalCost: Number
    },
    additionalCharges: Number
  },
  // Cost summary
  costSummary: {
    subtotal: Number,
    totalTaxes: Number,
    totalTransport: Number,
    totalAdditional: Number,
    grandTotal: Number,
    taxPercentage: Number
  },
  // Legacy tax fields (kept for compatibility)
  gst: Number,
  stateTaxes: Number,
  customDuty: Number,
  transportCost: Number,
  totalCost: Number,
  status: {
    type: String,
    enum: ['draft', 'pending-approval', 'approved', 'ordered', 'in-transit', 'delivered', 'cancelled', 'rejected'],
    default: 'draft'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  dates: {
    orderDate: Date,
    expectedDelivery: Date,
    actualDelivery: Date,
    approvedDate: Date
  },
  deliveryLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: Date
  }]
}, {
  timestamps: true
});

// Calculate final amount before saving
procurementSchema.pre('save', function(next) {
  if (this.pricing.unitPrice && this.quantity) {
    this.pricing.totalAmount = this.pricing.unitPrice * this.quantity;
    
    let finalAmount = this.pricing.totalAmount;
    if (this.pricing.tax) finalAmount += this.pricing.tax;
    if (this.pricing.discount) finalAmount -= this.pricing.discount;
    
    this.pricing.finalAmount = finalAmount;
  }
  next();
});

module.exports = mongoose.model('Procurement', procurementSchema);
