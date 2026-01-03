const mongoose = require('mongoose');

const costForecastSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  forecastPeriod: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  totalEstimatedCost: {
    type: Number,
    required: true
  },
  costBreakdown: {
    materials: {
      type: Number,
      default: 0
    },
    labor: {
      type: Number,
      default: 0
    },
    equipment: {
      type: Number,
      default: 0
    },
    transportation: {
      type: Number,
      default: 0
    },
    taxes: {
      type: Number,
      default: 0
    },
    overhead: {
      type: Number,
      default: 0
    },
    contingency: {
      type: Number,
      default: 0
    }
  },
  monthlyCostProjection: [{
    month: {
      type: Number,
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    projectedCost: {
      type: Number,
      required: true
    },
    actualCost: {
      type: Number,
      default: 0
    },
    variance: {
      type: Number,
      default: 0
    },
    variancePercentage: {
      type: Number,
      default: 0
    }
  }],
  costDrivers: [{
    category: {
      type: String,
      enum: ['Material', 'Labor', 'Equipment', 'Market', 'Regulatory', 'Weather', 'Other'],
      required: true
    },
    description: String,
    impact: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      required: true
    },
    estimatedCostImpact: Number,
    probability: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    }
  }],
  optimizationOpportunities: [{
    category: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    potentialSavings: {
      type: Number,
      required: true
    },
    savingsPercentage: {
      type: Number,
      required: true
    },
    implementationCost: {
      type: Number,
      default: 0
    },
    timeframe: {
      type: String,
      enum: ['Immediate', 'Short-term', 'Medium-term', 'Long-term'],
      default: 'Short-term'
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['Identified', 'Under Review', 'Approved', 'In Progress', 'Implemented', 'Rejected'],
      default: 'Identified'
    }
  }],
  riskFactors: [{
    riskType: {
      type: String,
      required: true
    },
    description: String,
    probability: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    impact: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      required: true
    },
    potentialCostIncrease: Number,
    mitigationStrategy: String
  }],
  benchmarks: {
    industryAverage: Number,
    bestInClass: Number,
    previousProjects: Number,
    variance: Number,
    performanceRating: {
      type: String,
      enum: ['Excellent', 'Good', 'Average', 'Below Average', 'Poor']
    }
  },
  accuracy: {
    confidenceLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 85
    },
    standardDeviation: Number,
    meanAbsoluteError: Number,
    forecastMethod: {
      type: String,
      enum: ['ML Model', 'Historical', 'Expert Estimate', 'Hybrid'],
      default: 'Hybrid'
    }
  },
  status: {
    type: String,
    enum: ['Draft', 'Active', 'Under Review', 'Approved', 'Revised', 'Archived'],
    default: 'Draft'
  },
  version: {
    type: Number,
    default: 1
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  lastReviewed: Date
}, {
  timestamps: true
});

// Indexes for performance
costForecastSchema.index({ project: 1, createdAt: -1 });
costForecastSchema.index({ status: 1 });
costForecastSchema.index({ 'forecastPeriod.start': 1, 'forecastPeriod.end': 1 });

// Virtual for total variance
costForecastSchema.virtual('totalVariance').get(function() {
  return this.monthlyCostProjection.reduce((sum, month) => sum + month.variance, 0);
});

// Virtual for average variance percentage
costForecastSchema.virtual('avgVariancePercentage').get(function() {
  const validMonths = this.monthlyCostProjection.filter(m => m.actualCost > 0);
  if (validMonths.length === 0) return 0;
  return validMonths.reduce((sum, month) => sum + month.variancePercentage, 0) / validMonths.length;
});

// Method to calculate total potential savings
costForecastSchema.methods.calculateTotalSavings = function() {
  return this.optimizationOpportunities.reduce((sum, opp) => {
    return sum + (opp.status !== 'Rejected' ? opp.potentialSavings : 0);
  }, 0);
};

// Method to calculate net savings (after implementation costs)
costForecastSchema.methods.calculateNetSavings = function() {
  return this.optimizationOpportunities.reduce((sum, opp) => {
    if (opp.status !== 'Rejected') {
      return sum + (opp.potentialSavings - opp.implementationCost);
    }
    return sum;
  }, 0);
};

// Method to update monthly variance
costForecastSchema.methods.updateMonthlyVariance = function(month, year, actualCost) {
  const monthData = this.monthlyCostProjection.find(m => m.month === month && m.year === year);
  if (monthData) {
    monthData.actualCost = actualCost;
    monthData.variance = actualCost - monthData.projectedCost;
    monthData.variancePercentage = ((monthData.variance / monthData.projectedCost) * 100).toFixed(2);
  }
  return this.save();
};

module.exports = mongoose.model('CostForecast', costForecastSchema);
