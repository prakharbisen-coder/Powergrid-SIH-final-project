const mongoose = require('mongoose');

const boqItemSchema = new mongoose.Schema({
  itemCode: {
    type: String,
    required: [true, 'Please provide item code'],
    trim: true
  },
  itemName: {
    type: String,
    required: [true, 'Please provide item name'],
    trim: true
  },
  category: {
    type: String,
    enum: ['Steel', 'Conductors', 'Insulators', 'Cement', 'Nuts/Bolts', 'Earthing', 'Others'],
    required: true
  },
  unit: {
    type: String,
    required: [true, 'Please provide unit'],
    enum: ['MT', 'KM', 'NOS', 'Bags', 'Kg', 'Meters', 'Sqm', 'Cum']
  },
  boqQuantity: {
    type: Number,
    required: [true, 'Please provide BOQ quantity'],
    min: [0, 'BOQ quantity cannot be negative']
  },
  consumedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Consumed quantity cannot be negative']
  },
  specifications: {
    type: String,
    trim: true
  },
  towerType: {
    type: String,
    enum: ['66kV Lattice', '132kV Lattice', '220kV Lattice', '400kV Lattice', '765kV Lattice', 'Monopole', 'Tubular', 'All', 'N/A']
  },
  remarks: {
    type: String,
    trim: true
  },
  unitRate: {
    type: Number,
    min: 0
  },
  totalCost: {
    type: Number,
    min: 0
  }
}, {
  _id: true
});

const boqSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  projectId: {
    type: String,
    required: true
  },
  projectName: {
    type: String,
    required: true
  },
  items: [boqItemSchema],
  totalBOQValue: {
    type: Number,
    default: 0
  },
  totalConsumedValue: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Approved', 'In Progress', 'Completed'],
    default: 'Draft'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  version: {
    type: Number,
    default: 1
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Calculate remaining quantity for each item
boqItemSchema.virtual('remainingQuantity').get(function() {
  return this.boqQuantity - this.consumedQuantity;
});

// Calculate variance percentage
boqItemSchema.virtual('variancePercent').get(function() {
  if (this.boqQuantity === 0) return 0;
  return ((this.consumedQuantity / this.boqQuantity) * 100).toFixed(2);
});

// Calculate total BOQ value before saving
boqSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.totalBOQValue = this.items.reduce((sum, item) => {
      return sum + (item.totalCost || 0);
    }, 0);
    
    this.totalConsumedValue = this.items.reduce((sum, item) => {
      const unitRate = item.unitRate || 0;
      return sum + (item.consumedQuantity * unitRate);
    }, 0);
  }
  next();
});

// Index for faster queries
boqSchema.index({ project: 1 });
boqSchema.index({ projectId: 1 });
boqSchema.index({ status: 1 });

module.exports = mongoose.model('BOQ', boqSchema);
