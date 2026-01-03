const Material = require('../models/Material');

// @desc    Get all materials
// @route   GET /api/materials
// @access  Private
exports.getMaterials = async (req, res) => {
  try {
    const { category, status, location, search } = req.query;
    
    let query = {};
    
    if (category) query.category = category;
    if (status) query.status = status;
    if (location) query.location = new RegExp(location, 'i');
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { materialId: new RegExp(search, 'i') }
      ];
    }

    const materials = await Material.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: materials.length,
      data: materials
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single material
// @route   GET /api/materials/:id
// @access  Private
exports.getMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    res.status(200).json({
      success: true,
      data: material
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create material
// @route   POST /api/materials
// @access  Private
exports.createMaterial = async (req, res) => {
  try {
    const material = await Material.create(req.body);

    res.status(201).json({
      success: true,
      data: material
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update material
// @route   PUT /api/materials/:id
// @access  Private
exports.updateMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    res.status(200).json({
      success: true,
      data: material
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete material
// @route   DELETE /api/materials/:id
// @access  Private (Admin only)
exports.deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
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

// @desc    Get low stock materials
// @route   GET /api/materials/low-stock
// @access  Private
exports.getLowStockMaterials = async (req, res) => {
  try {
    const materials = await Material.find({
      status: { $in: ['low', 'critical', 'out-of-stock'] }
    }).sort({ quantity: 1 });

    res.status(200).json({
      success: true,
      count: materials.length,
      data: materials
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get materials grouped by category
// @route   GET /api/materials/by-category
// @access  Private
exports.getMaterialsByCategory = async (req, res) => {
  try {
    const categoryBreakdown = await Material.aggregate([
      {
        $group: {
          _id: '$category',
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$price'] } },
          materialCount: { $count: {} },
          lowStock: {
            $sum: {
              $cond: [{ $in: ['$status', ['low', 'critical', 'out-of-stock']] }, 1, 0]
            }
          },
          materials: {
            $push: {
              id: '$_id',
              materialId: '$materialId',
              name: '$name',
              subCategory: '$subCategory',
              quantity: '$quantity',
              unit: '$unit',
              price: '$price',
              status: '$status',
              specifications: '$specifications'
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get subcategory breakdown for each category
    const subcategoryBreakdown = await Material.aggregate([
      {
        $group: {
          _id: {
            category: '$category',
            subCategory: '$subCategory'
          },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$price'] } },
          materialCount: { $count: {} },
          avgPrice: { $avg: '$price' }
        }
      },
      {
        $sort: { '_id.category': 1, '_id.subCategory': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        categoryBreakdown,
        subcategoryBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get material statistics
// @route   GET /api/materials/stats
// @access  Private
exports.getMaterialStats = async (req, res) => {
  try {
    const stats = await Material.aggregate([
      {
        $facet: {
          totalStats: [
            {
              $group: {
                _id: null,
                totalMaterials: { $count: {} },
                totalValue: { $sum: { $multiply: ['$quantity', '$price'] } },
                totalQuantity: { $sum: '$quantity' }
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
          categoryStats: [
            {
              $group: {
                _id: '$category',
                count: { $count: {} },
                totalValue: { $sum: { $multiply: ['$quantity', '$price'] } }
              }
            },
            {
              $sort: { totalValue: -1 }
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

// @desc    Bulk delete materials
// @route   POST /api/materials/bulk-delete
// @access  Private (Admin only)
exports.bulkDeleteMaterials = async (req, res) => {
  try {
    const { materialIds } = req.body;

    if (!materialIds || !Array.isArray(materialIds) || materialIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of material IDs'
      });
    }

    const result = await Material.deleteMany({ _id: { $in: materialIds } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} material(s) deleted successfully`,
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
