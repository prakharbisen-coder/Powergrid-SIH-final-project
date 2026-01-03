const express = require('express');
const router = express.Router();
const {
  getMaterials,
  getMaterial,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getLowStockMaterials,
  getMaterialsByCategory,
  getMaterialStats,
  bulkDeleteMaterials
} = require('../controllers/materialController');
const { protect, authorize } = require('../middleware/auth');
const { validateMaterial } = require('../middleware/materialValidation');

router.use(protect); // All routes require authentication

router.get('/low-stock', getLowStockMaterials);
router.get('/by-category', getMaterialsByCategory);
router.get('/stats', getMaterialStats);
router.post('/bulk-delete', authorize('admin', 'manager'), bulkDeleteMaterials);

router
  .route('/')
  .get(getMaterials)
  .post(validateMaterial, createMaterial); // Added validation middleware

router
  .route('/:id')
  .get(getMaterial)
  .put(validateMaterial, updateMaterial) // Added validation middleware
  .delete(authorize('admin', 'manager'), deleteMaterial);

module.exports = router;
