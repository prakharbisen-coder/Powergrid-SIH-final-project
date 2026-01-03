/**
 * AWS SNS SERVICE
 * Handles SMS and Email notifications for low stock alerts
 */

const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1', // Mumbai region
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Create SNS service object
const sns = new AWS.SNS({ apiVersion: '2010-03-31' });

/**
 * Send low stock alert via SNS (SMS + Email)
 * @param {Object} alertData - Alert information
 * @returns {Promise} SNS publish result
 */
async function sendLowStockAlert(alertData) {
  const {
    substationName,
    warehouseName,
    materialName,
    currentStock,
    threshold,
    unit,
    shortage,
    severity
  } = alertData;

  // Format the alert message
  const message = `⚠️ LOW STOCK ALERT

🏭 Location: ${warehouseName || substationName}
📦 Material: ${materialName}
📊 Current Stock: ${currentStock} ${unit}
📈 Required: ${threshold} ${unit}
🔻 Shortage: ${shortage} ${unit}
⚠️ Severity: ${severity.toUpperCase()}

⚡ Action Required: Reorder or transfer material immediately.

Timestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

  // SMS-optimized short message
  const smsMessage = `⚠ LOW STOCK: ${warehouseName || substationName} - ${materialName}: ${currentStock}/${threshold} ${unit}. Shortage: ${shortage}. Action required!`;

  const topicArn = process.env.AWS_SNS_TOPIC_ARN;

  if (!topicArn) {
    throw new Error('AWS_SNS_TOPIC_ARN not configured in environment variables');
  }

  try {
    // Publish to SNS Topic (sends to all subscribers - SMS + Email)
    const params = {
      TopicArn: topicArn,
      Subject: `⚠️ ${severity.toUpperCase()} Stock Alert: ${materialName}`,
      Message: message,
      MessageAttributes: {
        'severity': {
          DataType: 'String',
          StringValue: severity
        },
        'materialName': {
          DataType: 'String',
          StringValue: materialName
        },
        'warehouse': {
          DataType: 'String',
          StringValue: warehouseName || substationName
        }
      },
      // For SMS optimization
      MessageStructure: 'default'
    };

    console.log('\n📤 Sending SNS notification...');
    console.log(`Topic ARN: ${topicArn}`);
    console.log(`Subject: ${params.Subject}`);

    const result = await sns.publish(params).promise();

    console.log('✅ SNS notification sent successfully!');
    console.log(`Message ID: ${result.MessageId}`);

    return {
      success: true,
      messageId: result.MessageId,
      topicArn: topicArn,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ SNS notification failed:', error);
    throw error;
  }
}

/**
 * Send auto-reorder notification
 */
async function sendAutoReorderAlert(reorderData) {
  const {
    warehouseName,
    materialName,
    quantity,
    supplier,
    estimatedCost
  } = reorderData;

  const message = `🔄 AUTO-REORDER TRIGGERED

🏭 Warehouse: ${warehouseName}
📦 Material: ${materialName}
📊 Quantity: ${quantity}
🏢 Supplier: ${supplier}
💰 Estimated Cost: ₹${estimatedCost.toLocaleString('en-IN')}

✅ Purchase order has been automatically generated.

Timestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

  const topicArn = process.env.AWS_SNS_TOPIC_ARN;

  if (!topicArn) {
    throw new Error('AWS_SNS_TOPIC_ARN not configured');
  }

  try {
    const params = {
      TopicArn: topicArn,
      Subject: `🔄 Auto-Reorder: ${materialName}`,
      Message: message,
      MessageAttributes: {
        'alertType': {
          DataType: 'String',
          StringValue: 'auto-reorder'
        }
      }
    };

    const result = await sns.publish(params).promise();

    console.log('✅ Auto-reorder notification sent!');
    console.log(`Message ID: ${result.MessageId}`);

    return {
      success: true,
      messageId: result.MessageId
    };

  } catch (error) {
    console.error('❌ Auto-reorder notification failed:', error);
    throw error;
  }
}

/**
 * Send material shortage notification
 */
async function sendShortageAlert(shortageData) {
  const {
    substationName,
    materialName,
    requiredQuantity,
    availableQuantity,
    unit,
    urgency
  } = shortageData;

  const message = `🚨 MATERIAL SHORTAGE DETECTED

⚡ Substation: ${substationName}
📦 Material: ${materialName}
📊 Required: ${requiredQuantity} ${unit}
📉 Available: ${availableQuantity} ${unit}
🔻 Shortage: ${requiredQuantity - availableQuantity} ${unit}
⏰ Urgency: ${urgency.toUpperCase()}

⚠️ IMMEDIATE ACTION REQUIRED!

Timestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

  const topicArn = process.env.AWS_SNS_TOPIC_ARN;

  if (!topicArn) {
    throw new Error('AWS_SNS_TOPIC_ARN not configured');
  }

  try {
    const params = {
      TopicArn: topicArn,
      Subject: `🚨 URGENT: Material Shortage at ${substationName}`,
      Message: message,
      MessageAttributes: {
        'alertType': {
          DataType: 'String',
          StringValue: 'shortage'
        },
        'urgency': {
          DataType: 'String',
          StringValue: urgency
        }
      }
    };

    const result = await sns.publish(params).promise();

    console.log('✅ Shortage alert sent!');
    console.log(`Message ID: ${result.MessageId}`);

    return {
      success: true,
      messageId: result.MessageId
    };

  } catch (error) {
    console.error('❌ Shortage alert failed:', error);
    throw error;
  }
}

/**
 * Subscribe a phone number to SNS topic
 */
async function subscribePhoneNumber(phoneNumber) {
  const topicArn = process.env.AWS_SNS_TOPIC_ARN;

  if (!topicArn) {
    throw new Error('AWS_SNS_TOPIC_ARN not configured');
  }

  try {
    const params = {
      Protocol: 'sms',
      TopicArn: topicArn,
      Endpoint: phoneNumber // Format: +91XXXXXXXXXX
    };

    const result = await sns.subscribe(params).promise();

    console.log(`✅ Subscribed ${phoneNumber} to SNS topic`);
    console.log(`Subscription ARN: ${result.SubscriptionArn}`);

    return {
      success: true,
      subscriptionArn: result.SubscriptionArn
    };

  } catch (error) {
    console.error('❌ Subscription failed:', error);
    throw error;
  }
}

/**
 * Subscribe an email to SNS topic
 */
async function subscribeEmail(email) {
  const topicArn = process.env.AWS_SNS_TOPIC_ARN;

  if (!topicArn) {
    throw new Error('AWS_SNS_TOPIC_ARN not configured');
  }

  try {
    const params = {
      Protocol: 'email',
      TopicArn: topicArn,
      Endpoint: email
    };

    const result = await sns.subscribe(params).promise();

    console.log(`✅ Subscribed ${email} to SNS topic`);
    console.log(`Subscription ARN: ${result.SubscriptionArn}`);
    console.log('📧 Check email for confirmation link!');

    return {
      success: true,
      subscriptionArn: result.SubscriptionArn,
      note: 'User must confirm subscription via email'
    };

  } catch (error) {
    console.error('❌ Email subscription failed:', error);
    throw error;
  }
}

module.exports = {
  sendLowStockAlert,
  sendAutoReorderAlert,
  sendShortageAlert,
  subscribePhoneNumber,
  subscribeEmail
};
