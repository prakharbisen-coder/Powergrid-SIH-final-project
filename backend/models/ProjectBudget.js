const mongoose = require('mongoose');

const projectBudgetSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  budgetName: {
    type: String,
    required: true
  },
  fiscalYear: {
    type: String,
    required: true
  },
  totalBudget: {
    type: Number,
    required: true,
    min: 0
  },
  allocatedBudget: {
    type: Number,
    default: 0
  },
  committedBudget: {
    type: Number,
    default: 0
  },
  actualSpend: {
    type: Number,
    default: 0
  },
  remainingBudget: {
    type: Number,
    default: 0
  },
  budgetCategories: [{
    category: {
      type: String,
      required: true,
      enum: [
        'Materials',
        'Labor',
        'Equipment',
        'Transportation',
        'Taxes',
        'Licenses & Permits',
        'Insurance',
        'Overhead',
        'Contingency',
        'Professional Services',
        'Training',
        'Quality Assurance',
        'Safety',
        'Environmental',
        'Other'
      ]
    },
    allocated: {
      type: Number,
      required: true,
      min: 0
    },
    spent: {
      type: Number,
      default: 0
    },
    committed: {
      type: Number,
      default: 0
    },
    available: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    }
  }],
  milestones: [{
    name: {
      type: String,
      required: true
    },
    targetDate: {
      type: Date,
      required: true
    },
    budgetAllocation: {
      type: Number,
      required: true
    },
    actualSpend: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'Delayed', 'At Risk'],
      default: 'Not Started'
    },
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  }],
  costControls: [{
    controlType: {
      type: String,
      required: true,
      enum: ['Approval Required', 'Spending Limit', 'Vendor Restriction', 'Procurement Policy', 'Review Threshold', 'Other']
    },
    description: {
      type: String,
      required: true
    },
    threshold: Number,
    approvers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  budgetRevisions: [{
    revisionDate: {
      type: Date,
      default: Date.now
    },
    previousAmount: {
      type: Number,
      required: true
    },
    newAmount: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    category: String,
    justification: String
  }],
  alerts: [{
    alertType: {
      type: String,
      enum: ['Budget Exceeded', 'Threshold Reached', 'Forecast Overrun', 'Underspend', 'Reallocation Needed'],
      required: true
    },
    severity: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      default: 'Medium'
    },
    message: {
      type: String,
      required: true
    },
    category: String,
    amount: Number,
    triggeredAt: {
      type: Date,
      default: Date.now
    },
    isResolved: {
      type: Boolean,
      default: false
    },
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  cashFlowProjection: [{
    month: {
      type: Number,
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    projectedInflow: {
      type: Number,
      default: 0
    },
    projectedOutflow: {
      type: Number,
      required: true
    },
    actualInflow: {
      type: Number,
      default: 0
    },
    actualOutflow: {
      type: Number,
      default: 0
    },
    cumulativeBalance: {
      type: Number,
      default: 0
    }
  }],
  performanceMetrics: {
    costPerformanceIndex: {
      type: Number,
      default: 1.0
    },
    schedulePerformanceIndex: {
      type: Number,
      default: 1.0
    },
    earnedValue: {
      type: Number,
      default: 0
    },
    plannedValue: {
      type: Number,
      default: 0
    },
    actualCost: {
      type: Number,
      default: 0
    },
    estimateAtCompletion: Number,
    estimateToComplete: Number,
    varianceAtCompletion: Number,
    toCompletePerformanceIndex: Number
  },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Active', 'Closed', 'Rejected'],
    default: 'Draft'
  },
  approvalChain: [{
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: String,
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    comments: String,
    actionDate: Date
  }],
  notes: String,
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
projectBudgetSchema.index({ project: 1, fiscalYear: 1 });
projectBudgetSchema.index({ status: 1 });
projectBudgetSchema.index({ createdAt: -1 });

// Virtual for budget utilization percentage
projectBudgetSchema.virtual('utilizationPercentage').get(function() {
  if (this.totalBudget === 0) return 0;
  return ((this.actualSpend / this.totalBudget) * 100).toFixed(2);
});

// Virtual for burn rate
projectBudgetSchema.virtual('burnRate').get(function() {
  const monthsPassed = Math.ceil((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24 * 30));
  if (monthsPassed === 0) return 0;
  return (this.actualSpend / monthsPassed).toFixed(2);
});

// Method to update remaining budget
projectBudgetSchema.methods.updateRemainingBudget = function() {
  this.remainingBudget = this.totalBudget - this.actualSpend - this.committedBudget;
  return this.save();
};

// Method to allocate budget to category
projectBudgetSchema.methods.allocateToCate = function(category, amount) {
  const cat = this.budgetCategories.find(c => c.category === category);
  if (cat) {
    cat.allocated = amount;
    cat.available = cat.allocated - cat.spent - cat.committed;
    cat.percentage = ((cat.allocated / this.totalBudget) * 100).toFixed(2);
  } else {
    this.budgetCategories.push({
      category,
      allocated: amount,
      spent: 0,
      committed: 0,
      available: amount,
      percentage: ((amount / this.totalBudget) * 100).toFixed(2)
    });
  }
  this.allocatedBudget = this.budgetCategories.reduce((sum, cat) => sum + cat.allocated, 0);
  return this.save();
};

// Method to record spending
projectBudgetSchema.methods.recordSpending = function(category, amount, description) {
  const cat = this.budgetCategories.find(c => c.category === category);
  if (cat) {
    cat.spent += amount;
    cat.available = cat.allocated - cat.spent - cat.committed;
    this.actualSpend += amount;
    this.remainingBudget = this.totalBudget - this.actualSpend - this.committedBudget;
    
    // Check for alerts
    if (cat.spent > cat.allocated) {
      this.alerts.push({
        alertType: 'Budget Exceeded',
        severity: 'Critical',
        message: `${category} budget exceeded by ₹${(cat.spent - cat.allocated).toFixed(2)}`,
        category: category,
        amount: cat.spent - cat.allocated
      });
    } else if ((cat.spent / cat.allocated) > 0.9) {
      this.alerts.push({
        alertType: 'Threshold Reached',
        severity: 'High',
        message: `${category} budget is 90% utilized`,
        category: category,
        amount: cat.spent
      });
    }
  }
  return this.save();
};

// Method to calculate cost performance index
projectBudgetSchema.methods.calculateCPI = function() {
  if (this.performanceMetrics.actualCost === 0) return 1.0;
  this.performanceMetrics.costPerformanceIndex = 
    (this.performanceMetrics.earnedValue / this.performanceMetrics.actualCost).toFixed(2);
  return this.save();
};

module.exports = mongoose.model('ProjectBudget', projectBudgetSchema);
