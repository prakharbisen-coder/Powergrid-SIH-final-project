const Vendor = require('../models/Vendor');

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private
exports.getVendors = async (req, res) => {
  try {
    const { status, category, city, state, search, sortBy } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (category) query.materialCategories = category;
    if (city) query['address.city'] = new RegExp(city, 'i');
    if (state) query['address.state'] = new RegExp(state, 'i');
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { companyName: new RegExp(search, 'i') },
        { vendorId: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    let sortOptions = { createdAt: -1 };
    if (sortBy === 'rating') sortOptions = { rating: -1 };
    if (sortBy === 'name') sortOptions = { name: 1 };
    if (sortBy === 'totalOrders') sortOptions = { totalOrders: -1 };

    const vendors = await Vendor.find(query)
      .populate('createdBy', 'name email')
      .sort(sortOptions);

    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single vendor
// @route   GET /api/vendors/:id
// @access  Private
exports.getVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create vendor
// @route   POST /api/vendors
// @access  Private
exports.createVendor = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    const vendor = await Vendor.create(req.body);

    res.status(201).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update vendor
// @route   PUT /api/vendors/:id
// @access  Private
exports.updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete vendor
// @route   DELETE /api/vendors/:id
// @access  Private (Admin only)
exports.deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
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

// @desc    Bulk delete vendors
// @route   POST /api/vendors/bulk-delete
// @access  Private (Admin only)
exports.bulkDeleteVendors = async (req, res) => {
  try {
    const { vendorIds } = req.body;

    if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of vendor IDs'
      });
    }

    const result = await Vendor.deleteMany({ _id: { $in: vendorIds } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} vendor(s) deleted successfully`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get vendor statistics
// @route   GET /api/vendors/stats
// @access  Private
exports.getVendorStats = async (req, res) => {
  try {
    const stats = await Vendor.aggregate([
      {
        $facet: {
          totalStats: [
            {
              $group: {
                _id: null,
                totalVendors: { $count: {} },
                totalValue: { $sum: '$totalValue' },
                totalOrders: { $sum: '$totalOrders' },
                avgRating: { $avg: '$rating' }
              }
            }
          ],
          statusBreakdown: [
            {
              $group: {
                _id: '$status',
                count: { $count: {} }
              }
            }
          ],
          categoryBreakdown: [
            {
              $unwind: '$materialCategories'
            },
            {
              $group: {
                _id: '$materialCategories',
                count: { $count: {} }
              }
            },
            {
              $sort: { count: -1 }
            }
          ],
          topVendors: [
            {
              $sort: { totalValue: -1 }
            },
            {
              $limit: 10
            },
            {
              $project: {
                name: 1,
                companyName: 1,
                totalValue: 1,
                totalOrders: 1,
                rating: 1
              }
            }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update vendor rating
// @route   PUT /api/vendors/:id/rating
// @access  Private
exports.updateVendorRating = async (req, res) => {
  try {
    const { rating } = req.body;

    if (rating < 0 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 0 and 5'
      });
    }

    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { rating },
      { new: true, runValidators: true }
    );

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update vendor performance metrics
// @route   PUT /api/vendors/:id/performance
// @access  Private
exports.updatePerformanceMetrics = async (req, res) => {
  try {
    const { onTimeDelivery, qualityScore, responseTime } = req.body;

    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { 
        performanceMetrics: {
          onTimeDelivery,
          qualityScore,
          responseTime
        }
      },
      { new: true, runValidators: true }
    );

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get vendors by category
// @route   GET /api/vendors/category/:category
// @access  Private
exports.getVendorsByCategory = async (req, res) => {
  try {
    const vendors = await Vendor.find({
      materialCategories: req.params.category,
      status: 'active'
    }).sort({ rating: -1 });

    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
