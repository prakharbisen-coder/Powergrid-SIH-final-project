const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMaterials,
  getProjectStats,
  calculateMaterialRequirements,
  predictProjectMaterials,
  checkMLHealth
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

// Public/protected routes
router.get('/ml-health', protect, checkMLHealth);
router.get('/stats/summary', protect, getProjectStats);
router.get('/:id/material-requirements', protect, calculateMaterialRequirements);
router.post('/:id/predict', protect, predictProjectMaterials);

router.route('/')
  .get(protect, getProjects)
  .post(protect, authorize('manager', 'admin'), createProject);

router.route('/:id')
  .get(protect, getProject)
  .put(protect, authorize('manager', 'admin'), updateProject)
  .delete(protect, authorize('admin'), deleteProject);

router.post('/:id/materials', protect, authorize('manager', 'admin'), addMaterials);

module.exports = router;
