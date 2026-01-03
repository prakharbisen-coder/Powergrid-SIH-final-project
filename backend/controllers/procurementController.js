const Procurement = require('../models/Procurement');
const Material = require('../models/Material');
const taxService = require('../services/taxService');
const vendorComparisonService = require('../services/vendorComparisonService');

// @desc    Get all procurement orders
// @route   GET /api/procurement
// @access  Private
exports.getProcurements = async (req, res) => {
  try {
    const { status, priority, vendor } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (vendor) query['vendor.name'] = new RegExp(vendor, 'i');

    const procurements = await Procurement.find(query)
      .populate('material')
      .populate('deliveryLocation')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: procurements.length,
      data: procurements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single procurement order
// @route   GET /api/procurement/:id
// @access  Private
exports.getProcurement = async (req, res) => {
  try {
    const procurement = await Procurement.findById(req.params.id)
      .populate('material')
      .populate('deliveryLocation')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!procurement) {
      return res.status(404).json({
        success: false,
        message: 'Procurement order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: procurement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create procurement order with tax calculation
// @route   POST /api/procurement
// @access  Private
exports.createProcurement = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    
    // Get material details if material ID provided
    let materialDetails = null;
    if (req.body.material) {
      materialDetails = await Material.findById(req.body.material);
    }

    // Calculate taxes if required fields are provided
    if (req.body.quantity && req.body.unitPrice && req.body.originState && req.body.deliveryState) {
      const taxCalculation = taxService.calculateTotalCost({
        basePrice: req.body.unitPrice || 0,
        material: materialDetails?.name || req.body.materialName || 'Other',
        quantity: req.body.quantity || 1,
        originState: req.body.originState,
        destState: req.body.deliveryState,
        isImported: req.body.isImported || false,
        distance: req.body.distance || 0,
        weight: req.body.weight || req.body.quantity,
        vehicleType: req.body.vehicleType || 'standard',
        additionalCharges: req.body.additionalCharges || 0
      });

      // Add tax breakdown to procurement order
      req.body.taxBreakdown = taxCalculation.breakdown;
      req.body.costSummary = taxCalculation.summary;
      req.body.totalCost = taxCalculation.summary.grandTotal;

      // Update cost fields
      req.body.gst = taxCalculation.breakdown.gst.totalGST;
      req.body.stateTaxes = taxCalculation.breakdown.stateTaxes.totalStateTax;
      req.body.customDuty = taxCalculation.breakdown.customDuty.customDutyAmount;
      req.body.transportCost = taxCalculation.breakdown.transport.totalCost;
    }
    
    const procurement = await Procurement.create(req.body);

    res.status(201).json({
      success: true,
      data: procurement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update procurement order
// @route   PUT /api/procurement/:id
// @access  Private
exports.updateProcurement = async (req, res) => {
  try {
    const procurement = await Procurement.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!procurement) {
      return res.status(404).json({
        success: false,
        message: 'Procurement order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: procurement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve procurement order
// @route   PUT /api/procurement/:id/approve
// @access  Private (Manager/Admin)
exports.approveProcurement = async (req, res) => {
  try {
    const procurement = await Procurement.findById(req.params.id);

    if (!procurement) {
      return res.status(404).json({
        success: false,
        message: 'Procurement order not found'
      });
    }

    procurement.status = 'approved';
    procurement.approvedBy = req.user.id;
    procurement.dates.approvedDate = Date.now();
    
    await procurement.save();

    res.status(200).json({
      success: true,
      data: procurement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete procurement order
// @route   DELETE /api/procurement/:id
// @access  Private
exports.deleteProcurement = async (req, res) => {
  try {
    const procurement = await Procurement.findByIdAndDelete(req.params.id);

    if (!procurement) {
      return res.status(404).json({
        success: false,
        message: 'Procurement order not found'
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

// @desc    Calculate taxes for procurement order
// @route   POST /api/procurement/calculate-tax
// @access  Private
exports.calculateTax = async (req, res) => {
  try {
    const {
      basePrice,
      material,
      materialId,
      quantity,
      originState,
      destState,
      isImported,
      distance,
      weight,
      vehicleType,
      additionalCharges
    } = req.body;

    // Get material details if material ID provided
    let materialName = material;
    if (materialId) {
      const materialDetails = await Material.findById(materialId);
      if (materialDetails) {
        materialName = materialDetails.name;
      }
    }

    // Calculate taxes
    const taxCalculation = taxService.calculateTotalCost({
      basePrice: basePrice || 0,
      material: materialName || 'Other',
      quantity: quantity || 1,
      originState: originState,
      destState: destState,
      isImported: isImported || false,
      distance: distance || 0,
      weight: weight || quantity,
      vehicleType: vehicleType || 'standard',
      additionalCharges: additionalCharges || 0
    });

    // Get optimization recommendations
    const recommendations = taxService.getTaxOptimizationRecommendations({
      material: materialName || 'Other',
      quantity: quantity || 1,
      currentState: destState,
      possibleStates: req.body.alternativeStates || [],
      isImported: isImported || false
    });

    res.status(200).json({
      success: true,
      data: {
        taxCalculation,
        recommendations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all available states
// @route   GET /api/procurement/states
// @access  Private
exports.getStates = async (req, res) => {
  try {
    const states = taxService.getAllStates();

    res.status(200).json({
      success: true,
      data: states
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get custom duty rates
// @route   GET /api/procurement/custom-duty-rates
// @access  Private
exports.getCustomDutyRates = async (req, res) => {
  try {
    const rates = taxService.getCustomDutyRates();

    res.status(200).json({
      success: true,
      data: rates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Compare multiple vendors
// @route   POST /api/procurement/compare-vendors
// @access  Private
exports.compareVendors = async (req, res) => {
  try {
    const { vendors, requirements } = req.body;

    if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of vendors to compare'
      });
    }

    if (!requirements) {
      return res.status(400).json({
        success: false,
        message: 'Please provide procurement requirements'
      });
    }

    const comparison = vendorComparisonService.compareVendors(vendors, requirements);

    res.status(200).json({
      success: true,
      data: comparison
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get vendor comparison matrix
// @route   POST /api/procurement/vendor-matrix
// @access  Private
exports.getVendorMatrix = async (req, res) => {
  try {
    const { vendors } = req.body;

    if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of vendors'
      });
    }

    const matrix = vendorComparisonService.getComparisonMatrix(vendors);

    res.status(200).json({
      success: true,
      data: matrix
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Calculate total cost of ownership for vendor
// @route   POST /api/procurement/calculate-tco
// @access  Private
exports.calculateTCO = async (req, res) => {
  try {
    const { vendor, requirements } = req.body;

    if (!vendor) {
      return res.status(400).json({
        success: false,
        message: 'Please provide vendor information'
      });
    }

    if (!requirements) {
      return res.status(400).json({
        success: false,
        message: 'Please provide procurement requirements'
      });
    }

    const tco = vendorComparisonService.calculateTCO(vendor, requirements);

    res.status(200).json({
      success: true,
      data: tco
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
