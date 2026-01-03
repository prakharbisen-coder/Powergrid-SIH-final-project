/**
 * INVENTORY ALERT ROUTES
 * RESTful API endpoints for warehouse inventory management and low-stock alerts
 */

const express = require('express');
const router = express.Router();
const {
  addWarehouse,
  addMaterial,
  updateMaterial,
  testAlert,
  getAllAlerts,
  runStockCheck,
  getWarehouseMaterials,
  getAllWarehouses
} = require('../controllers/inventoryAlertController');

// ========== WAREHOUSE MANAGEMENT ==========

/**
 * @route   POST /api/inventory/warehouse/add
 * @desc    Add a new warehouse with geolocation
 * @body    { warehouseId, name, latitude, longitude, address, city, state, pincode, capacity }
 * @example 
 * {
 *   "warehouseId": "WH001",
 *   "name": "Nagpur Warehouse",
 *   "latitude": 21.1458,
 *   "longitude": 79.0882,
 *   "city": "Nagpur",
 *   "state": "Maharashtra",
 *   "capacity": 15000
 * }
 */
router.post('/warehouse/add', addWarehouse);

/**
 * @route   GET /api/inventory/warehouses
 * @desc    Get all operational warehouses
 */
router.get('/warehouses', getAllWarehouses);

// ========== MATERIAL MANAGEMENT ==========

/**
 * @route   POST /api/inventory/material/add
 * @desc    Add material to warehouse inventory
 * @body    { warehouseId, materialName, qty, minQty, unit, category }
 * @example
 * {
 *   "warehouseId": "WH001",
 *   "materialName": "Tower Parts",
 *   "qty": 150,
 *   "minQty": 300,
 *   "unit": "units",
 *   "category": "Steel"
 * }
 */
router.post('/material/add', addMaterial);

/**
 * @route   POST /api/inventory/material/update
 * @desc    Update material quantity (auto-triggers alert if low)
 * @body    { warehouseId, materialName, qty }
 * @example
 * {
 *   "warehouseId": "WH001",
 *   "materialName": "Tower Parts",
 *   "qty": 120
 * }
 */
router.post('/material/update', updateMaterial);

/**
 * @route   GET /api/inventory/materials/:warehouseId
 * @desc    Get all materials for a specific warehouse
 */
router.get('/materials/:warehouseId', getWarehouseMaterials);

// ========== ALERT SYSTEM ==========

/**
 * @route   GET /api/inventory/alert/test
 * @desc    Test alert system for specific warehouse material
 * @query   warehouseId, materialName
 * @example /api/inventory/alert/test?warehouseId=WH001&materialName=Tower%20Parts
 */
router.get('/alert/test', testAlert);

/**
 * @route   GET /api/inventory/alert/all
 * @desc    Get all current low-stock alerts across all warehouses
 */
router.get('/alert/all', getAllAlerts);

/**
 * @route   GET /api/inventory/alert/run-check
 * @desc    Run automated stock check across all warehouses
 */
router.get('/alert/run-check', runStockCheck);

module.exports = router;
