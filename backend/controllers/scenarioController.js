const Scenario = require('../models/Scenario');

// @desc    Get all scenarios
// @route   GET /api/scenarios
// @access  Private
exports.getScenarios = async (req, res) => {
  try {
    const { type, status } = req.query;
    
    let query = {
      $or: [
        { createdBy: req.user.id },
        { sharedWith: req.user.id }
      ]
    };
    
    if (type) query.type = type;
    if (status) query.status = status;

    const scenarios = await Scenario.find(query)
      .populate('createdBy', 'name email')
      .populate('sharedWith', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: scenarios.length,
      data: scenarios
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single scenario
// @route   GET /api/scenarios/:id
// @access  Private
exports.getScenario = async (req, res) => {
  try {
    const scenario = await Scenario.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('sharedWith', 'name email');

    if (!scenario) {
      return res.status(404).json({
        success: false,
        message: 'Scenario not found'
      });
    }

    res.status(200).json({
      success: true,
      data: scenario
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create scenario
// @route   POST /api/scenarios
// @access  Private
exports.createScenario = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    
    const scenario = await Scenario.create(req.body);

    res.status(201).json({
      success: true,
      data: scenario
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update scenario
// @route   PUT /api/scenarios/:id
// @access  Private
exports.updateScenario = async (req, res) => {
  try {
    const scenario = await Scenario.findById(req.params.id);

    if (!scenario) {
      return res.status(404).json({
        success: false,
        message: 'Scenario not found'
      });
    }

    // Check if user owns the scenario
    if (scenario.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this scenario'
      });
    }

    const updatedScenario = await Scenario.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: updatedScenario
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete scenario
// @route   DELETE /api/scenarios/:id
// @access  Private
exports.deleteScenario = async (req, res) => {
  try {
    const scenario = await Scenario.findById(req.params.id);

    if (!scenario) {
      return res.status(404).json({
        success: false,
        message: 'Scenario not found'
      });
    }

    // Check if user owns the scenario
    if (scenario.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this scenario'
      });
    }

    await scenario.deleteOne();

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
