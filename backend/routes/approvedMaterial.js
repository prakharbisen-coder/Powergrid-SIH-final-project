/**
 * APPROVED MATERIAL ROUTES
 * API endpoints for managing PowerGrid-approved materials
 * 
 * Base URL: /api/approved
 * 
 * Endpoints:
 * - POST /api/approved/add - Add new approved material
 * - GET /api/approved/all - Get all approved materials
 * - POST /api/material/validate - Validate material before adding
 * - GET /api/approved/search - Search approved materials
 * - PUT /api/approved/:id/deactivate - Deactivate material
 * - GET /api/approved/categories - Get all categories
 */

const express = require('express');
const router = express.Router();
const approvedMaterialController = require('../controllers/approvedMaterialController');

// Add new approved material
router.post('/add', approvedMaterialController.addApprovedMaterial);

// Get all approved materials
router.get('/all', approvedMaterialController.getAllApprovedMaterials);

// Validate material
router.post('/validate', approvedMaterialController.validateMaterial);

// Search approved materials
router.get('/search', approvedMaterialController.searchApprovedMaterials);

// Deactivate material
router.put('/:id/deactivate', approvedMaterialController.deactivateMaterial);

// Get all categories
router.get('/categories', approvedMaterialController.getCategories);

module.exports = router;
