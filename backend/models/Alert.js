const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['critical', 'warning', 'info', 'success']
  },
  title: {
    type: String,
    required: [true, 'Please provide alert title'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Please provide alert message']
  },
  category: {
    type: String,
    enum: ['stock', 'budget', 'forecast', 'procurement', 'system', 'vendor'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'dismissed'],
    default: 'active'
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['material', 'budget', 'forecast', 'procurement', 'user']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedEntity.entityType'
    }
  },
  action: {
    type: String
  },
  actionUrl: {
    type: String
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: {
    type: Date
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
alertSchema.index({ type: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
