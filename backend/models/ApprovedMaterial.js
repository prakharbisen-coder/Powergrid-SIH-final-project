/**
 * APPROVED MATERIALS MODEL
 * PowerGrid-approved materials for procurement and inventory
 */

const mongoose = require('mongoose');

const approvedMaterialSchema = new mongoose.Schema({
  materialName: {
    type: String,
    required: [true, 'Material name is required'],
    trim: true,
    unique: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Tower Parts',
      'Conductors', 
      'Insulators', 
      'Hardware',
      'Circuit Breakers', 
      'Transformers', 
      'Steel Structures',
      'Foundation Materials',
      'Earthing Materials',
      'Protection Equipment',
      'Cables'
    ]
  },
  specifications: {
    type: mongoose.Schema.Types.Mixed, // Flexible object for various specifications
    default: {}
  },
  description: {
    type: String,
    trim: true
  },
  standardCode: {
    type: String, // IS Code, IEC Code, etc.
    trim: true
  },
  unit: {
    type: String,
    default: 'units',
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  addedBy: {
    type: String,
    default: 'SYSTEM'
  },
  approvalDate: {
    type: Date,
    default: Date.now
  },
  deactivationDate: {
    type: Date
  },
  deactivationReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for fast lookup
approvedMaterialSchema.index({ materialName: 'text' });
approvedMaterialSchema.index({ isActive: 1 });

// Static method to check if material is approved
approvedMaterialSchema.statics.isApproved = async function(materialName) {
  const material = await this.findOne({ 
    materialName: new RegExp(`^${materialName}$`, 'i'),
    isActive: true 
  });
  return !!material;
};

// Static method to get approved material details
approvedMaterialSchema.statics.getApprovedMaterial = async function(materialName) {
  return await this.findOne({ 
    materialName: new RegExp(`^${materialName}$`, 'i'),
    isActive: true 
  });
};

module.exports = mongoose.model('ApprovedMaterial', approvedMaterialSchema);
