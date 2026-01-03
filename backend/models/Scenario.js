const mongoose = require('mongoose');

const scenarioSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide scenario name'],
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['what-if', 'optimization', 'risk-analysis', 'comparison'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'running', 'completed', 'failed'],
    default: 'draft'
  },
  parameters: {
    demandIncrease: Number,
    budgetConstraint: Number,
    timeframe: Number,
    region: String,
    materials: [String]
  },
  results: {
    totalCost: Number,
    timeToComplete: Number,
    resourceUtilization: Number,
    riskLevel: String,
    recommendations: [String],
    chartData: mongoose.Schema.Types.Mixed
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tags: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('Scenario', scenarioSchema);
