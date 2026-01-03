const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getAnalytic,
  createAnalytics,
  getRegionalSummary,
  deleteAnalytics
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // All routes require authentication

router.get('/summary/region', getRegionalSummary);

router
  .route('/')
  .get(getAnalytics)
  .post(createAnalytics);

router
  .route('/:id')
  .get(getAnalytic)
  .delete(authorize('admin'), deleteAnalytics);

module.exports = router;
