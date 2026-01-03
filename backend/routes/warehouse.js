const express = require('express');
const router = express.Router();
const {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  addInventory,
  deleteWarehouse
} = require('../controllers/warehouseController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // All routes require authentication

router
  .route('/')
  .get(getWarehouses)
  .post(authorize('admin', 'manager'), createWarehouse);

router
  .route('/:id')
  .get(getWarehouse)
  .put(authorize('admin', 'manager'), updateWarehouse)
  .delete(authorize('admin'), deleteWarehouse);

router.post('/:id/inventory', addInventory);

module.exports = router;
