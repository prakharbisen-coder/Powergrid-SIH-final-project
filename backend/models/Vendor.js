const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  vendorId: {
    type: String,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Please provide vendor name'],
    trim: true
  },
  companyName: {
    type: String,
    required: [true, 'Please provide company name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Please provide phone number']
  },
  alternatePhone: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  gstin: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please provide valid GSTIN']
  },
  pan: {
    type: String,
    uppercase: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please provide valid PAN']
  },
  materialCategories: [{
    type: String,
    enum: ['Steel', 'Conductors', 'Insulators', 'Transformers', 'Substations', 'Towers', 'Cables', 'Earthing', 'Hardware', 'Others']
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalValue: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blacklisted', 'pending'],
    default: 'active'
  },
  paymentTerms: {
    type: String,
    enum: ['immediate', '15-days', '30-days', '45-days', '60-days', '90-days'],
    default: '30-days'
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    branch: String,
    accountHolderName: String
  },
  documents: [{
    type: {
      type: String,
      enum: ['registration', 'gst-certificate', 'pan-card', 'quality-certificate', 'iso-certificate', 'other']
    },
    fileName: String,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  certifications: [{
    name: String,
    issuedBy: String,
    validTill: Date
  }],
  performanceMetrics: {
    onTimeDelivery: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    qualityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    responseTime: {
      type: Number, // in hours
      default: 24
    }
  },
  contactPerson: {
    name: String,
    designation: String,
    phone: String,
    email: String
  },
  remarks: String,
  lastOrderDate: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
vendorSchema.index({ vendorId: 1 });
vendorSchema.index({ email: 1 });
vendorSchema.index({ status: 1 });
vendorSchema.index({ materialCategories: 1 });
vendorSchema.index({ 'address.city': 1 });
vendorSchema.index({ 'address.state': 1 });

// Virtual for full address
vendorSchema.virtual('fullAddress').get(function() {
  const { street, city, state, pincode, country } = this.address;
  return [street, city, state, pincode, country].filter(Boolean).join(', ');
});

// Method to calculate vendor score
vendorSchema.methods.calculateVendorScore = function() {
  const { onTimeDelivery, qualityScore } = this.performanceMetrics;
  const ratingScore = (this.rating / 5) * 100;
  
  return Math.round((onTimeDelivery * 0.4) + (qualityScore * 0.4) + (ratingScore * 0.2));
};

// Pre-save middleware to generate vendorId
vendorSchema.pre('save', async function(next) {
  if (!this.vendorId) {
    const count = await mongoose.model('Vendor').countDocuments();
    this.vendorId = `VEN-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Vendor', vendorSchema);
