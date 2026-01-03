/**
 * APPROVED MATERIAL CONTROLLER
 * Manages PowerGrid-approved materials database
 * 
 * API Endpoints:
 * - POST /api/approved/add - Add new approved material
 * - GET /api/approved/all - Get all approved materials
 * - POST /api/material/validate - Validate material before adding to inventory
 * - GET /api/approved/search - Search approved materials
 * - PUT /api/approved/:id/deactivate - Deactivate material
 * - GET /api/approved/categories - Get all material categories
 */

const ApprovedMaterial = require('../models/ApprovedMaterial');

/**
 * Add new approved material
 * POST /api/approved/add
 */
const addApprovedMaterial = async (req, res) => {
  try {
    const {
      materialName,
      category,
      specifications,
      standardCode,
      unit,
      description
    } = req.body;

    // Validate required fields
    if (!materialName || !category || !unit) {
      return res.status(400).json({
        success: false,
        message: 'materialName, category, and unit are required'
      });
    }

    // Check if material already exists
    const existingMaterial = await ApprovedMaterial.findOne({ 
      materialName: { $regex: new RegExp(`^${materialName}$`, 'i') } 
    });

    if (existingMaterial) {
      return res.status(400).json({
        success: false,
        message: 'Material already exists in approved list',
        material: existingMaterial
      });
    }

    // Create new approved material
    const approvedMaterial = new ApprovedMaterial({
      materialName,
      category,
      specifications: specifications || {},
      standardCode,
      unit,
      description,
      isActive: true,
      approvalDate: new Date()
    });

    await approvedMaterial.save();

    console.log(`✅ Added new approved material: ${materialName}`);

    res.status(201).json({
      success: true,
      message: 'Material added to approved list',
      material: approvedMaterial
    });

  } catch (error) {
    console.error('Error adding approved material:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding approved material',
      error: error.message
    });
  }
};

/**
 * Get all approved materials
 * GET /api/approved/all
 */
const getAllApprovedMaterials = async (req, res) => {
  try {
    const { category, isActive = true } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const materials = await ApprovedMaterial.find(filter)
      .sort({ materialName: 1 })
      .lean();

    res.json({
      success: true,
      count: materials.length,
      materials: materials
    });

  } catch (error) {
    console.error('Error fetching approved materials:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching approved materials',
      error: error.message
    });
  }
};

/**
 * Validate material
 * POST /api/material/validate
 */
const validateMaterial = async (req, res) => {
  try {
    const { materialName } = req.body;

    if (!materialName) {
      return res.status(400).json({
        success: false,
        message: 'materialName is required'
      });
    }

    const isApproved = await ApprovedMaterial.isApproved(materialName);

    if (!isApproved) {
      return res.json({
        success: false,
        valid: false,
        status: 'INVALID_MATERIAL',
        material: materialName,
        message: 'This material is not required for this project and cannot be added to inventory.',
        reason: 'Material not found in PowerGrid approved materials database'
      });
    }

    const approvedMaterial = await ApprovedMaterial.getApprovedMaterial(materialName);

    res.json({
      success: true,
      valid: true,
      status: 'APPROVED',
      material: materialName,
      message: 'Material is approved for use in PowerGrid projects',
      details: approvedMaterial
    });

  } catch (error) {
    console.error('Error validating material:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating material',
      error: error.message
    });
  }
};

/**
 * Search approved materials
 * GET /api/approved/search?q=Tower
 */
const searchApprovedMaterials = async (req, res) => {
  try {
    const { q, category } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const filter = {
      isActive: true,
      $text: { $search: q }
    };

    if (category) filter.category = category;

    const materials = await ApprovedMaterial.find(filter)
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .lean();

    res.json({
      success: true,
      query: q,
      count: materials.length,
      materials: materials
    });

  } catch (error) {
    console.error('Error searching materials:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching materials',
      error: error.message
    });
  }
};

/**
 * Deactivate approved material
 * PUT /api/approved/:id/deactivate
 */
const deactivateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const material = await ApprovedMaterial.findById(id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    material.isActive = false;
    material.deactivationReason = reason || 'No reason provided';
    material.deactivationDate = new Date();

    await material.save();

    console.log(`⚠️  Deactivated material: ${material.materialName}`);

    res.json({
      success: true,
      message: 'Material deactivated',
      material: material
    });

  } catch (error) {
    console.error('Error deactivating material:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating material',
      error: error.message
    });
  }
};

/**
 * Get all material categories
 * GET /api/approved/categories
 */
const getCategories = async (req, res) => {
  try {
    const categories = await ApprovedMaterial.distinct('category', { isActive: true });

    res.json({
      success: true,
      count: categories.length,
      categories: categories.sort()
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

module.exports = {
  addApprovedMaterial,
  getAllApprovedMaterials,
  validateMaterial,
  searchApprovedMaterials,
  deactivateMaterial,
  getCategories
};
