const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  warehouseId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Please provide warehouse name'],
    trim: true
  },
  location: {
    address: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  capacity: {
    total: {
      type: Number,
      required: true
    },
    used: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      default: 'sq.ft'
    }
  },
  inventory: [{
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    },
    quantity: Number,
    location: String, // Zone/Rack location within warehouse
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['operational', 'maintenance', 'full', 'closed'],
    default: 'operational'
  },
  contactInfo: {
    phone: String,
    email: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Warehouse', warehouseSchema);
