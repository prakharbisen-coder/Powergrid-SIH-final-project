const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(morgan('dev')); // Logging
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8081', 'http://localhost:8082'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/budget', require('./routes/budget'));
app.use('/api/forecasting', require('./routes/forecasting'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/scenarios', require('./routes/scenarios'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/warehouse', require('./routes/warehouse'));
app.use('/api/procurement', require('./routes/procurement'));
app.use('/api/cost-optimization', require('./routes/costOptimization'));
app.use('/api/boq', require('./routes/boq'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/inventory', require('./routes/inventory')); // Inventory Alert System
app.use('/api/alert', require('./routes/snsAlert')); // AWS SNS Notifications
app.use('/api/approved', require('./routes/approvedMaterial')); // Approved Materials
app.use('/api/material', require('./routes/approvedMaterial')); // Material Validation

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Power Grid Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
