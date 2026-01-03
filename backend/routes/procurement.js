const express = require('express');
const router = express.Router();
const {
  getProcurements,
  getProcurement,
  createProcurement,
  updateProcurement,
  approveProcurement,
  deleteProcurement,
  calculateTax,
  getStates,
  getCustomDutyRates,
  compareVendors,
  getVendorMatrix,
  calculateTCO
} = require('../controllers/procurementController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // All routes require authentication

router
  .route('/')
  .get(getProcurements)
  .post(createProcurement);

// Tax calculation routes
router.post('/calculate-tax', calculateTax);
router.get('/states', getStates);
router.get('/custom-duty-rates', getCustomDutyRates);

// Vendor comparison routes
router.post('/compare-vendors', compareVendors);
router.post('/vendor-matrix', getVendorMatrix);
router.post('/calculate-tco', calculateTCO);

router
  .route('/:id')
  .get(getProcurement)
  .put(updateProcurement)
  .delete(deleteProcurement);

router.put('/:id/approve', authorize('admin', 'manager'), approveProcurement);

module.exports = router;
