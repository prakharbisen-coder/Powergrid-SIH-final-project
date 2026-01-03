/**
 * WarehouseMaterial Model
 * Tracks material inventory levels across warehouses with automatic low-stock detection
 */

const mongoose = require('mongoose');

const warehouseMaterialSchema = new mongoose.Schema({
  // Material identification
  materialName: {
    type: String,
    required: [true, 'Material name is required'],
    trim: true
  },
  
  // Warehouse reference
  warehouseId: {
    type: String,
    required: [true, 'Warehouse ID is required'],
    ref: 'Warehouse'
  },
  
  // Quantity tracking
  qty: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  
  // Minimum threshold for alerts
  minQty: {
    type: Number,
    required: [true, 'Minimum quantity threshold is required'],
    min: [0, 'Minimum quantity cannot be negative'],
    default: 100
  },
  
  // Unit of measurement
  unit: {
    type: String,
    default: 'units',
    trim: true
  },
  
  // Alert status
  alertStatus: {
    type: String,
    enum: ['normal', 'low', 'critical', 'out-of-stock'],
    default: 'normal'
  },
  
  // Last alert timestamp
  lastAlertSent: {
    type: Date,
    default: null
  },
  
  // Material category
  category: {
    type: String,
    enum: ['Conductors', 'Steel', 'Insulators', 'Transformers', 'Circuit Breakers', 'Cables', 'Earthing', 'Hardware', 'Other'],
    default: 'Other'
  }
}, {
  timestamps: true
});

// Index for faster queries
warehouseMaterialSchema.index({ warehouseId: 1, materialName: 1 }, { unique: true });
warehouseMaterialSchema.index({ alertStatus: 1 });

// Virtual for stock percentage
warehouseMaterialSchema.virtual('stockPercentage').get(function() {
  if (this.minQty === 0) return 100;
  return Math.round((this.qty / this.minQty) * 100);
});

// Pre-save hook to update alert status
warehouseMaterialSchema.pre('save', function(next) {
  if (this.qty === 0) {
    this.alertStatus = 'out-of-stock';
  } else if (this.qty < this.minQty * 0.25) {
    this.alertStatus = 'critical';
  } else if (this.qty < this.minQty) {
    this.alertStatus = 'low';
  } else {
    this.alertStatus = 'normal';
  }
  next();
});

module.exports = mongoose.model('WarehouseMaterial', warehouseMaterialSchema);
