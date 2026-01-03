const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  materialId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Please provide material name'],
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Steel', 'Conductors', 'Insulators', 'Cement', 'Nuts/Bolts', 'Earthing', 'Others']
  },
  subCategory: {
    type: String,
    required: function() {
      return this.category !== 'Others';
    },
    enum: {
      values: [
        // Steel subcategories
        'Angle Steel', 'Channel Steel', 'Flat Steel', 'Round Steel', 'Steel Plates', 'Galvanized Steel',
        // Conductor subcategories
        'ACSR Conductors', 'AAC Conductors', 'AAAC Conductors', 'Optical Fiber Cable', 'Earth Wire', 'Shield Wire',
        // Insulator subcategories
        'Disc Insulators', 'Pin Insulators', 'Suspension Insulators', 'Strain Insulators', 'Composite Insulators', 'Polymer Insulators',
        // Cement subcategories
        'OPC 43 Grade', 'OPC 53 Grade', 'PSC Cement', 'Ready Mix Concrete',
        // Nuts/Bolts subcategories
        'Foundation Bolts', 'Tower Bolts', 'HT Bolts', 'Washers', 'Nuts', 'Clamps',
        // Earthing subcategories
        'Earth Rods', 'Earth Wire', 'GI Strip', 'Earthing Electrodes', 'Chemical Earthing', 'Earthing Accessories',
        // Others
        'Miscellaneous'
      ],
      message: '{VALUE} is not a valid subcategory'
    }
  },
  specifications: {
    // For Steel
    grade: String,
    thickness: Number,
    length: Number,
    width: Number,
    weight: Number,
    
    // For Conductors
    conductor_size: String,
    stranding: String,
    breaking_strength: Number,
    resistance: Number,
    
    // For Insulators
    voltage_rating: String,
    creepage_distance: Number,
    mechanical_strength: Number,
    
    // For Cement
    cement_grade: String,
    bag_weight: Number,
    compressive_strength: Number,
    
    // For Nuts/Bolts
    diameter: Number,
    bolt_length: Number,
    material_grade: String,
    thread_type: String,
    
    // For Earthing
    rod_diameter: Number,
    rod_length: Number,
    material_type: String,
    resistance_value: Number
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Quantity cannot be negative']
  },
  threshold: {
    type: Number,
    required: true,
    min: [0, 'Threshold cannot be negative']
  },
  location: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['optimal', 'low', 'critical', 'out-of-stock'],
    default: function() {
      if (this.quantity === 0) return 'out-of-stock';
      if (this.quantity < this.threshold * 0.5) return 'critical';
      if (this.quantity < this.threshold) return 'low';
      return 'optimal';
    }
  },
  reusable: {
    type: Number,
    default: 0,
    min: [0, 'Reusable quantity cannot be negative']
  },
  unit: {
    type: String,
    default: 'units'
  },
  price: {
    type: Number,
    min: [0, 'Price cannot be negative']
  },
  supplier: {
    type: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

// Update status before saving
materialSchema.pre('save', function(next) {
  if (this.quantity === 0) {
    this.status = 'out-of-stock';
  } else if (this.quantity < this.threshold * 0.5) {
    this.status = 'critical';
  } else if (this.quantity < this.threshold) {
    this.status = 'low';
  } else {
    this.status = 'optimal';
  }
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model('Material', materialSchema);
