const Project = require('../models/Project');
const { predictMaterialDemand, checkMLServiceHealth } = require('../services/mlService');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    const { status, region, voltage, towerType } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (region) query['location.region'] = region;
    if (voltage) query['infrastructure.voltage'] = voltage;
    if (towerType) query['infrastructure.towerType'] = towerType;

    const projects = await Project.find(query)
      .populate('materials.material', 'name category')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('materials.material')
      .populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Manager/Admin)
exports.createProject = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;

    const project = await Project.create(req.body);

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Manager/Admin)
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin)
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add materials to project
// @route   POST /api/projects/:id/materials
// @access  Private (Manager/Admin)
exports.addMaterials = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const { materials } = req.body;

    if (!Array.isArray(materials)) {
      return res.status(400).json({
        success: false,
        message: 'Materials should be an array'
      });
    }

    project.materials.push(...materials);
    await project.save();

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get project statistics
// @route   GET /api/projects/stats/summary
// @access  Private
exports.getProjectStats = async (req, res) => {
  try {
    const stats = await Project.aggregate([
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          totalBudget: { $sum: '$budget.total' },
          totalSpent: { $sum: '$budget.spent' },
          avgBudget: { $avg: '$budget.total' }
        }
      }
    ]);

    const statusCount = await Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const regionCount = await Project.aggregate([
      {
        $group: {
          _id: '$location.region',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {},
        byStatus: statusCount,
        byRegion: regionCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Calculate material requirements for project
// @route   GET /api/projects/:id/material-requirements
// @access  Private
exports.calculateMaterialRequirements = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Basic calculation based on tower type and count
    const materialRequirements = calculateRequirements(project);

    res.status(200).json({
      success: true,
      data: {
        projectId: project.projectId,
        projectName: project.name,
        requirements: materialRequirements
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to calculate material requirements
function calculateRequirements(project) {
  const { towerType, towerCount, voltage } = project.infrastructure;
  
  // Base material requirements per tower (simplified)
  const materialFactors = {
    '66kV Lattice': { steel: 2.5, conductor: 1.2, insulator: 18, foundation: 3 },
    '132kV Lattice': { steel: 4.5, conductor: 2.4, insulator: 24, foundation: 5 },
    '220kV Lattice': { steel: 8.0, conductor: 4.8, insulator: 36, foundation: 8 },
    '400kV Lattice': { steel: 15.0, conductor: 9.6, insulator: 48, foundation: 12 },
    '765kV Lattice': { steel: 25.0, conductor: 16.8, insulator: 72, foundation: 18 }
  };

  const factors = materialFactors[towerType] || materialFactors['132kV Lattice'];

  return {
    steel: {
      quantity: factors.steel * towerCount,
      unit: 'tons',
      description: 'Tower structural steel'
    },
    conductor: {
      quantity: factors.conductor * towerCount,
      unit: 'km',
      description: 'ACSR Conductors'
    },
    insulators: {
      quantity: factors.insulator * towerCount,
      unit: 'units',
      description: 'Disc/Polymer insulators'
    },
    foundation: {
      quantity: factors.foundation * towerCount,
      unit: 'cubic meters',
      description: 'Concrete foundation'
    }
  };
}

// @desc    Get ML-based material predictions for a project
// @route   POST /api/projects/:id/predict
// @access  Private
exports.predictProjectMaterials = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get ML predictions
    const predictions = await predictMaterialDemand(project);

    res.status(200).json({
      success: true,
      data: predictions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check ML service health
// @route   GET /api/projects/ml-health
// @access  Private
exports.checkMLHealth = async (req, res) => {
  try {
    const health = await checkMLServiceHealth();
    res.status(200).json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = exports;
