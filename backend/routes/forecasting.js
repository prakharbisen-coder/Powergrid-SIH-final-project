const express = require('express');
const router = express.Router();
const {
  getForecasts,
  getForecast,
  createForecast,
  updateForecast,
  deleteForecast,
  generateMLForecast,
  checkMLForecastStatus,
  generateAdvancedForecast
} = require('../controllers/forecastController');
const { protect } = require('../middleware/auth');

router.use(protect); // All routes require authentication

// ML Forecasting routes
router.post('/generate', generateMLForecast);
router.post('/generate-advanced', generateAdvancedForecast);
router.get('/ml-status', checkMLForecastStatus);

router
  .route('/')
  .get(getForecasts)
  .post(createForecast);

router
  .route('/:id')
  .get(getForecast)
  .put(updateForecast)
  .delete(deleteForecast);

module.exports = router;
