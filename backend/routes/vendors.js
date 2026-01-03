const express = require('express');
const router = express.Router();
const {
  getVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor,
  bulkDeleteVendors,
  getVendorStats,
  updateVendorRating,
  updatePerformanceMetrics,
  getVendorsByCategory
} = require('../controllers/vendorController');
const { protect, authorize } = require('../middleware/auth');

// Public routes (no auth required for viewing vendors)
router.get('/stats', getVendorStats);
router.get('/category/:category', getVendorsByCategory);
router.get('/', getVendors);
router.get('/:id', getVendor);

// Protected routes (require authentication)
router.use(protect);

router.post('/bulk-delete', authorize('admin', 'manager'), bulkDeleteVendors);

router
  .route('/')
  .post(authorize('admin', 'manager'), createVendor);

router
  .route('/:id')
  .put(authorize('admin', 'manager'), updateVendor)
  .delete(authorize('admin'), deleteVendor);

router.put('/:id/rating', updateVendorRating);
router.put('/:id/performance', updatePerformanceMetrics);

module.exports = router;
