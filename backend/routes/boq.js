const express = require('express');
const router = express.Router();
const {
  getBOQByProject,
  createOrUpdateBOQ,
  addBOQItem,
  updateBOQItem,
  deleteBOQItem,
  updateConsumption,
  getBOQForForecasting,
  approveBOQ,
  uploadBOQFromCSV
} = require('../controllers/boqController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Main BOQ routes
router.post('/', createOrUpdateBOQ);
router.post('/upload/:projectId', uploadBOQFromCSV);
router.get('/project/:projectId', getBOQByProject);
router.get('/project/:projectId/forecast-data', getBOQForForecasting);
router.put('/:projectId/approve', approveBOQ);

// BOQ item routes
router.post('/:projectId/item', addBOQItem);
router.put('/:projectId/item/:itemId', updateBOQItem);
router.delete('/:projectId/item/:itemId', deleteBOQItem);
router.put('/:projectId/item/:itemId/consumption', updateConsumption);

module.exports = router;
