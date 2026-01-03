const express = require('express');
const router = express.Router();
const {
  createCostForecast,
  getCostForecasts,
  getCostForecastById,
  updateCostForecast,
  updateMonthlyActual,
  addOptimizationOpportunity,
  getCostSavingsSummary,
  createProjectBudget,
  getProjectBudgets,
  getProjectBudgetById,
  updateProjectBudget,
  recordSpending,
  addBudgetRevision,
  getBudgetPerformance,
  compareBudgetVsForecast
} = require('../controllers/costOptimizationController');

const { protect } = require('../middleware/auth');

// Cost Forecast routes
router.route('/forecast')
  .get(protect, getCostForecasts)
  .post(protect, createCostForecast);

router.route('/forecast/:id')
  .get(protect, getCostForecastById)
  .put(protect, updateCostForecast);

router.put('/forecast/:id/monthly-actual', protect, updateMonthlyActual);
router.post('/forecast/:id/opportunity', protect, addOptimizationOpportunity);
router.get('/forecast/:id/savings', protect, getCostSavingsSummary);

// Project Budget routes
router.route('/budget')
  .get(protect, getProjectBudgets)
  .post(protect, createProjectBudget);

router.route('/budget/:id')
  .get(protect, getProjectBudgetById)
  .put(protect, updateProjectBudget);

router.post('/budget/:id/spending', protect, recordSpending);
router.post('/budget/:id/revision', protect, addBudgetRevision);
router.get('/budget/:id/performance', protect, getBudgetPerformance);

// Comparison routes
router.get('/compare/:budgetId/:forecastId', protect, compareBudgetVsForecast);

module.exports = router;
