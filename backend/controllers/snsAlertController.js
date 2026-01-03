/**
 * SNS ALERT CONTROLLER
 * Handles API endpoints for sending SNS notifications
 */

const { 
  sendLowStockAlert, 
  sendAutoReorderAlert, 
  sendShortageAlert,
  subscribePhoneNumber,
  subscribeEmail
} = require('../services/snsService');

/**
 * @route   POST /api/alert/send
 * @desc    Send low stock alert via SNS
 * @access  Public
 * @body    { substationName, materialName, currentStock, threshold, unit }
 */
exports.sendAlert = async (req, res) => {
  try {
    const { 
      substationName, 
      warehouseName,
      materialName, 
      currentStock, 
      threshold,
      unit = 'units'
    } = req.body;

    // Validation
    if (!materialName || currentStock === undefined || threshold === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide materialName, currentStock, and threshold'
      });
    }

    if (!substationName && !warehouseName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either substationName or warehouseName'
      });
    }

    // Check if stock is below threshold
    if (currentStock >= threshold) {
      return res.status(200).json({
        success: true,
        message: 'Stock levels are sufficient. No alert sent.',
        data: {
          currentStock,
          threshold,
          status: 'OK'
        }
      });
    }

    // Calculate shortage and severity
    const shortage = threshold - currentStock;
    const percentage = Math.round((currentStock / threshold) * 100);
    
    let severity = 'low';
    if (currentStock === 0) {
      severity = 'out-of-stock';
    } else if (percentage < 25) {
      severity = 'critical';
    } else if (percentage < 50) {
      severity = 'low';
    }

    // Send SNS notification
    const result = await sendLowStockAlert({
      substationName,
      warehouseName: warehouseName || substationName,
      materialName,
      currentStock,
      threshold,
      unit,
      shortage,
      severity
    });

    res.status(200).json({
      success: true,
      message: 'Alert sent successfully via SNS',
      data: {
        alert: {
          material: materialName,
          location: warehouseName || substationName,
          currentStock,
          threshold,
          shortage,
          severity,
          percentage
        },
        notification: result
      }
    });

  } catch (error) {
    console.error('Error sending alert:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send alert',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @route   POST /api/alert/auto-reorder
 * @desc    Send auto-reorder notification
 * @access  Public
 */
exports.sendAutoReorder = async (req, res) => {
  try {
    const {
      warehouseName,
      materialName,
      quantity,
      supplier,
      estimatedCost
    } = req.body;

    if (!warehouseName || !materialName || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const result = await sendAutoReorderAlert({
      warehouseName,
      materialName,
      quantity,
      supplier: supplier || 'TBD',
      estimatedCost: estimatedCost || 0
    });

    res.status(200).json({
      success: true,
      message: 'Auto-reorder notification sent',
      data: result
    });

  } catch (error) {
    console.error('Error sending auto-reorder:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   POST /api/alert/shortage
 * @desc    Send material shortage alert
 * @access  Public
 */
exports.sendShortage = async (req, res) => {
  try {
    const {
      substationName,
      materialName,
      requiredQuantity,
      availableQuantity,
      unit = 'units',
      urgency = 'high'
    } = req.body;

    if (!substationName || !materialName || requiredQuantity === undefined || availableQuantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const result = await sendShortageAlert({
      substationName,
      materialName,
      requiredQuantity,
      availableQuantity,
      unit,
      urgency
    });

    res.status(200).json({
      success: true,
      message: 'Shortage alert sent',
      data: result
    });

  } catch (error) {
    console.error('Error sending shortage alert:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   POST /api/alert/subscribe/phone
 * @desc    Subscribe phone number to SNS alerts
 * @access  Public
 */
exports.subscribePhone = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required (format: +91XXXXXXXXXX)'
      });
    }

    const result = await subscribePhoneNumber(phoneNumber);

    res.status(200).json({
      success: true,
      message: 'Phone number subscribed to alerts',
      data: result
    });

  } catch (error) {
    console.error('Error subscribing phone:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   POST /api/alert/subscribe/email
 * @desc    Subscribe email to SNS alerts
 * @access  Public
 */
exports.subscribeEmailAddress = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const result = await subscribeEmail(email);

    res.status(200).json({
      success: true,
      message: 'Email subscribed. Check inbox for confirmation link.',
      data: result
    });

  } catch (error) {
    console.error('Error subscribing email:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/alert/test
 * @desc    Send test alert (for SIH demonstration)
 * @access  Public
 */
exports.sendTestAlert = async (req, res) => {
  try {
    const testAlert = {
      substationName: 'Substation A',
      warehouseName: 'Nagpur Central Warehouse',
      materialName: 'Disc Insulators',
      currentStock: 20,
      threshold: 100,
      unit: 'units',
      shortage: 80,
      severity: 'critical'
    };

    const result = await sendLowStockAlert(testAlert);

    res.status(200).json({
      success: true,
      message: 'Test alert sent successfully',
      data: {
        testData: testAlert,
        notification: result
      }
    });

  } catch (error) {
    console.error('Error sending test alert:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  sendAlert: exports.sendAlert,
  sendAutoReorder: exports.sendAutoReorder,
  sendShortage: exports.sendShortage,
  subscribePhone: exports.subscribePhone,
  subscribeEmailAddress: exports.subscribeEmailAddress,
  sendTestAlert: exports.sendTestAlert
};
