const mongoose = require('mongoose');

const forecastSchema = new mongoose.Schema({
  project: {
    type: String,
    required: [true, 'Please provide project name'],
    trim: true
  },
  material: {
    type: String,
    required: [true, 'Please provide material type'],
    trim: true
  },
  duration: {
    type: Number,
    required: [true, 'Please provide duration in days'],
    min: [1, 'Duration must be at least 1 day']
  },
  forecastData: [{
    day: String,
    demand: Number,
    forecast: Number,
    supply: Number
  }],
  insights: [{
    icon: String,
    title: String,
    description: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high']
    }
  }],
  accuracy: {
    type: Number,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'archived'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  summary: {
    type: String
  },
  // ML Forecast fields
  mlPredictions: [{
    material: String,
    predicted_quantity: Number,
    confidence_interval_low: Number,
    confidence_interval_high: Number,
    confidence_score: Number,
    unit: String,
    // Tax-related fields for each material
    taxBreakdown: {
      customDuty: {
        customDutyAmount: Number,
        assessableValue: Number
      },
      gst: {
        totalGST: Number
      },
      stateTaxes: {
        totalStateTax: Number,
        cess: Number
      },
      transport: {
        totalCost: Number
      }
    },
    costWithTax: Number,
    taxImpact: Number,
    taxPercentage: Number
  }],
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  riskLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High']
  },
  recommendations: [String],
  predictedQuantity: {
    type: Number,
    default: 0
  },
  actualQuantity: {
    type: Number,
    default: 0
  },
  variance: {
    type: Number,
    default: 0
  },
  period: {
    start: Date,
    end: Date
  },
  // Tax summary for entire forecast
  taxSummary: {
    totalBaseAmount: {
      type: Number,
      default: 0
    },
    totalTaxAmount: {
      type: Number,
      default: 0
    },
    totalCostWithTax: {
      type: Number,
      default: 0
    },
    averageTaxPercentage: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Forecast', forecastSchema);
