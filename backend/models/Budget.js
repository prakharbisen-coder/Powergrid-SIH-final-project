const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Please provide budget category'],
    enum: ['Towers', 'Conductors', 'Substations', 'Transformers', 'Labor', 'Transport', 'Equipment', 'Others']
  },
  allocated: {
    type: Number,
    required: [true, 'Please provide allocated amount'],
    min: [0, 'Allocated amount cannot be negative']
  },
  spent: {
    type: Number,
    default: 0,
    min: [0, 'Spent amount cannot be negative']
  },
  projected: {
    type: Number,
    min: [0, 'Projected amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['on-track', 'under-budget', 'over-budget', 'critical'],
    default: 'on-track'
  },
  fiscalYear: {
    type: String,
    required: true
  },
  department: {
    type: String
  },
  notes: {
    type: String
  },
  transactions: [{
    description: String,
    amount: Number,
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['expense', 'allocation', 'transfer']
    }
  }]
}, {
  timestamps: true
});

// Calculate status before saving
budgetSchema.pre('save', function(next) {
  const utilizationPercent = (this.spent / this.allocated) * 100;
  
  if (utilizationPercent >= 100) {
    this.status = 'critical';
  } else if (utilizationPercent >= 90) {
    this.status = 'over-budget';
  } else if (utilizationPercent < 70) {
    this.status = 'under-budget';
  } else {
    this.status = 'on-track';
  }
  
  next();
});

module.exports = mongoose.model('Budget', budgetSchema);
