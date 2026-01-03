const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  region: {
    type: String,
    required: true
  },
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  metrics: {
    demand: Number,
    fulfillment: Number,
    efficiency: Number,
    costPerUnit: Number,
    averageDeliveryTime: Number
  },
  materialBreakdown: [{
    material: String,
    quantity: Number,
    value: Number
  }],
  budgetAnalysis: {
    allocated: Number,
    spent: Number,
    variance: Number,
    utilizationPercent: Number
  },
  performanceIndicators: {
    onTimeDelivery: Number,
    stockAccuracy: Number,
    forecastAccuracy: Number,
    supplierPerformance: Number
  },
  trends: [{
    date: Date,
    value: Number,
    metric: String
  }],
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster querying
analyticsSchema.index({ region: 1, 'period.startDate': 1, 'period.endDate': 1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
