const express = require('express');
const router = express.Router();
const {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  addTransaction,
  deleteBudget
} = require('../controllers/budgetController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // All routes require authentication

router
  .route('/')
  .get(getBudgets)
  .post(authorize('admin', 'manager'), createBudget);

router
  .route('/:id')
  .get(getBudget)
  .put(authorize('admin', 'manager'), updateBudget)
  .delete(authorize('admin'), deleteBudget);

router.post('/:id/transaction', addTransaction);

module.exports = router;
