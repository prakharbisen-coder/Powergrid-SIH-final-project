/**
 * SNS ALERT ROUTES
 * API endpoints for AWS SNS notifications
 */

const express = require('express');
const router = express.Router();
const {
  sendAlert,
  sendAutoReorder,
  sendShortage,
  subscribePhone,
  subscribeEmailAddress,
  sendTestAlert
} = require('../controllers/snsAlertController');

/**
 * @route   POST /api/alert/send
 * @desc    Send low stock alert via SNS (SMS + Email)
 * @body    { substationName, materialName, currentStock, threshold }
 * @example
 * {
 *   "substationName": "Substation A",
 *   "materialName": "Disc Insulators",
 *   "currentStock": 20,
 *   "threshold": 100,
 *   "unit": "units"
 * }
 */
router.post('/send', sendAlert);

/**
 * @route   POST /api/alert/auto-reorder
 * @desc    Send auto-reorder notification
 * @body    { warehouseName, materialName, quantity, supplier, estimatedCost }
 */
router.post('/auto-reorder', sendAutoReorder);

/**
 * @route   POST /api/alert/shortage
 * @desc    Send material shortage alert
 * @body    { substationName, materialName, requiredQuantity, availableQuantity }
 */
router.post('/shortage', sendShortage);

/**
 * @route   POST /api/alert/subscribe/phone
 * @desc    Subscribe phone number to SNS topic
 * @body    { phoneNumber: "+91XXXXXXXXXX" }
 */
router.post('/subscribe/phone', subscribePhone);

/**
 * @route   POST /api/alert/subscribe/email
 * @desc    Subscribe email to SNS topic (requires email confirmation)
 * @body    { email: "user@example.com" }
 */
router.post('/subscribe/email', subscribeEmailAddress);

/**
 * @route   GET /api/alert/test
 * @desc    Send test alert for SIH demonstration
 * @example Message: "⚠ LOW STOCK: Substation A has only 20 Disc Insulators left. Required: 100."
 */
router.get('/test', sendTestAlert);

module.exports = router;
