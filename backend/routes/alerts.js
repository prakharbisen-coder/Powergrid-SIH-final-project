const express = require('express');
const router = express.Router();
const {
  getAlerts,
  getAlert,
  createAlert,
  updateAlert,
  acknowledgeAlert,
  resolveAlert,
  deleteAlert
} = require('../controllers/alertController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // All routes require authentication

router
  .route('/')
  .get(getAlerts)
  .post(createAlert);

router
  .route('/:id')
  .get(getAlert)
  .put(updateAlert)
  .delete(authorize('admin', 'manager'), deleteAlert);

router.put('/:id/acknowledge', acknowledgeAlert);
router.put('/:id/resolve', resolveAlert);

module.exports = router;
