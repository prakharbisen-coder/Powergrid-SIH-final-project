const Analytics = require('../models/Analytics');

// @desc    Get all analytics
// @route   GET /api/analytics
// @access  Private
exports.getAnalytics = async (req, res) => {
  try {
    const { region, startDate, endDate } = req.query;
    
    let query = {};
    
    if (region) query.region = new RegExp(region, 'i');
    if (startDate || endDate) {
      query['period.startDate'] = {};
      if (startDate) query['period.startDate'].$gte = new Date(startDate);
      if (endDate) query['period.endDate'] = { $lte: new Date(endDate) };
    }

    const analytics = await Analytics.find(query)
      .populate('generatedBy', 'name email')
      .sort({ 'period.startDate': -1 });

    res.status(200).json({
      success: true,
      count: analytics.length,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single analytics record
// @route   GET /api/analytics/:id
// @access  Private
exports.getAnalytic = async (req, res) => {
  try {
    const analytic = await Analytics.findById(req.params.id)
      .populate('generatedBy', 'name email');

    if (!analytic) {
      return res.status(404).json({
        success: false,
        message: 'Analytics record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: analytic
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create analytics record
// @route   POST /api/analytics
// @access  Private
exports.createAnalytics = async (req, res) => {
  try {
    req.body.generatedBy = req.user.id;
    
    const analytic = await Analytics.create(req.body);

    res.status(201).json({
      success: true,
      data: analytic
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get analytics summary by region
// @route   GET /api/analytics/summary/region
// @access  Private
exports.getRegionalSummary = async (req, res) => {
  try {
    const summary = await Analytics.aggregate([
      {
        $group: {
          _id: '$region',
          avgDemand: { $avg: '$metrics.demand' },
          avgFulfillment: { $avg: '$metrics.fulfillment' },
          avgEfficiency: { $avg: '$metrics.efficiency' },
          totalRecords: { $sum: 1 }
        }
      },
      {
        $sort: { avgDemand: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete analytics record
// @route   DELETE /api/analytics/:id
// @access  Private (Admin only)
exports.deleteAnalytics = async (req, res) => {
  try {
    const analytic = await Analytics.findByIdAndDelete(req.params.id);

    if (!analytic) {
      return res.status(404).json({
        success: false,
        message: 'Analytics record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
