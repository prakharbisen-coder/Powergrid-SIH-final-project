const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Please provide project name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    region: {
      type: String,
      required: true,
      enum: ['North', 'South', 'East', 'West', 'Central', 'North-East']
    },
    state: {
      type: String,
      required: true
    },
    district: String,
    terrain: {
      type: String,
      enum: ['Plain', 'Hilly', 'Coastal', 'Desert', 'Forest'],
      required: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  timeline: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['Planning', 'In Progress', 'Delayed', 'Completed', 'On Hold'],
      default: 'Planning'
    }
  },
  budget: {
    total: {
      type: Number,
      required: true,
      min: 0
    },
    allocated: {
      type: Number,
      default: 0
    },
    spent: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    financialYear: {
      type: String,
      required: true
    }
  },
  infrastructure: {
    towerType: {
      type: String,
      enum: ['66kV Lattice', '132kV Lattice', '220kV Lattice', '400kV Lattice', '765kV Lattice', 'Monopole', 'Tubular'],
      required: true
    },
    towerCount: {
      type: Number,
      required: true,
      min: 0
    },
    substationType: {
      type: String,
      enum: ['AIS (Air Insulated)', 'GIS (Gas Insulated)', 'Hybrid', 'Mobile']
    },
    substationCount: {
      type: Number,
      default: 0
    },
    lineLength: {
      value: Number,
      unit: {
        type: String,
        default: 'km'
      }
    },
    voltage: {
      type: String,
      enum: ['66kV', '132kV', '220kV', '400kV', '765kV'],
      required: true
    }
  },
  costs: {
    gst: {
      type: Number,
      default: 18, // percentage
      min: 0,
      max: 100
    },
    transportCost: {
      type: Number,
      default: 0,
      min: 0
    },
    stateTaxes: {
      type: Number,
      default: 0,
      min: 0
    },
    customDuty: {
      type: Number,
      default: 0,
      min: 0
    },
    otherCharges: {
      type: Number,
      default: 0
    }
  },
  materials: [{
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    },
    estimatedQuantity: Number,
    allocatedQuantity: Number,
    usedQuantity: {
      type: Number,
      default: 0
    }
  }],
  weather: {
    avgTemperature: Number,
    rainfall: {
      type: String,
      enum: ['Low', 'Medium', 'High']
    },
    cycloneProne: {
      type: Boolean,
      default: false
    }
  },
  contractor: {
    name: String,
    contact: String,
    performanceRating: {
      type: Number,
      min: 0,
      max: 5
    }
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'On Hold', 'Cancelled'],
    default: 'Active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Auto-generate projectId
projectSchema.pre('save', async function(next) {
  if (!this.projectId) {
    const count = await mongoose.model('Project').countDocuments();
    this.projectId = `PRJ-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Calculate remaining budget
projectSchema.virtual('remainingBudget').get(function() {
  return this.budget.total - this.budget.spent;
});

// Calculate budget utilization percentage
projectSchema.virtual('budgetUtilization').get(function() {
  return ((this.budget.spent / this.budget.total) * 100).toFixed(2);
});

// Calculate project progress
projectSchema.virtual('progress').get(function() {
  const now = new Date();
  const start = new Date(this.timeline.startDate);
  const end = new Date(this.timeline.endDate);
  
  if (now < start) return 0;
  if (now > end) return 100;
  
  const totalDuration = end - start;
  const elapsed = now - start;
  return ((elapsed / totalDuration) * 100).toFixed(2);
});

projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Project', projectSchema);
