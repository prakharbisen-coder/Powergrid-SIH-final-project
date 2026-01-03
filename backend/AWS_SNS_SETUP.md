# AWS SNS Integration for PowerGrid Alert System

## Overview
This system integrates AWS SNS (Simple Notification Service) to send SMS and Email notifications automatically when:
- Stock goes below threshold
- Material shortage is detected in a substation
- Auto-reorder is triggered

## Features
✅ Automatic SMS notifications
✅ Email notifications
✅ Low stock alerts with geospatial data
✅ Auto-reorder notifications
✅ Material shortage alerts
✅ Subscribe/unsubscribe functionality
✅ SIH-ready demonstration

## Folder Structure
```
backend/
├── services/
│   └── snsService.js          # AWS SNS service implementation
├── controllers/
│   └── snsAlertController.js  # API request handlers
├── routes/
│   └── snsAlert.js            # API endpoints
├── .env                       # AWS credentials
└── server.js                  # Main server file
```

## Setup Instructions

### 1. Install AWS SDK
```bash
cd backend
npm install aws-sdk
```

### 2. Configure AWS Credentials
Update `backend/.env` with your AWS credentials:

```env
# AWS SNS Configuration
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_SNS_TOPIC_ARN=arn:aws:sns:ap-south-1:123456789012:PowerGrid-Alerts
```

### 3. Create SNS Topic in AWS
1. Go to AWS Console → SNS
2. Create a new topic: `PowerGrid-Alerts`
3. Copy the Topic ARN
4. Paste it in `.env` file

### 4. Subscribe to Topic
**Option 1: Via API**
```bash
# Subscribe Phone Number
curl -X POST http://localhost:5000/api/alert/subscribe/phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+91XXXXXXXXXX"}'

# Subscribe Email
curl -X POST http://localhost:5000/api/alert/subscribe/email \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com"}'
```

**Option 2: Via AWS Console**
1. Go to SNS → Topics → PowerGrid-Alerts
2. Click "Create subscription"
3. Select Protocol: SMS or Email
4. Enter phone number (+91XXXXXXXXXX) or email
5. Confirm subscription (for email)

### 5. Start the Backend
```bash
cd backend
npm start
```

## API Endpoints

### 1. Send Low Stock Alert
**POST** `/api/alert/send`

**Request Body:**
```json
{
  "substationName": "Substation A",
  "materialName": "Disc Insulators",
  "currentStock": 20,
  "threshold": 100,
  "unit": "units"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Alert sent successfully via SNS",
  "data": {
    "alert": {
      "material": "Disc Insulators",
      "location": "Substation A",
      "currentStock": 20,
      "threshold": 100,
      "shortage": 80,
      "severity": "critical",
      "percentage": 20
    },
    "notification": {
      "success": true,
      "messageId": "abc123-def456",
      "topicArn": "arn:aws:sns:ap-south-1:...",
      "timestamp": "2025-12-09T10:30:00.000Z"
    }
  }
}
```

**Example Notification Message:**
```
⚠️ LOW STOCK ALERT

🏭 Location: Substation A
📦 Material: Disc Insulators
📊 Current Stock: 20 units
📈 Required: 100 units
🔻 Shortage: 80 units
⚠️ Severity: CRITICAL

⚡ Action Required: Reorder or transfer material immediately.

Timestamp: 09/12/2025, 4:00:00 PM
```

### 2. Send Auto-Reorder Notification
**POST** `/api/alert/auto-reorder`

```json
{
  "warehouseName": "Nagpur Central Warehouse",
  "materialName": "Tower Parts",
  "quantity": 500,
  "supplier": "Steel India Ltd",
  "estimatedCost": 250000
}
```

### 3. Send Shortage Alert
**POST** `/api/alert/shortage`

```json
{
  "substationName": "Substation B",
  "materialName": "Conductors ACSR",
  "requiredQuantity": 1000,
  "availableQuantity": 200,
  "unit": "meters",
  "urgency": "critical"
}
```

### 4. Send Test Alert (SIH Demo)
**GET** `/api/alert/test`

Sends a pre-configured test alert:
```
⚠ LOW STOCK: Substation A has only 20 Disc Insulators left. Required: 100.
```

### 5. Subscribe Phone Number
**POST** `/api/alert/subscribe/phone`

```json
{
  "phoneNumber": "+91XXXXXXXXXX"
}
```

### 6. Subscribe Email
**POST** `/api/alert/subscribe/email`

```json
{
  "email": "admin@powergrid.com"
}
```

## Automatic Integration

The SNS notifications are automatically triggered when:

1. **Inventory Alert System** detects low stock
2. **Material update** brings stock below threshold
3. **Automated stock check** runs (cron job)

Example from `alertService.js`:
```javascript
// Automatically sends SNS when stock is low
if (material.qty < material.minQty) {
  await sendLowStockAlert({
    warehouseName: warehouse.name,
    materialName: materialName,
    currentStock: material.qty,
    threshold: material.minQty,
    shortage: material.minQty - material.qty
  });
}
```

## Testing

### Test with Postman

1. **Import Collection**
   - Create new request
   - Method: POST
   - URL: `http://localhost:5000/api/alert/send`
   - Body (JSON):
   ```json
   {
     "substationName": "Test Substation",
     "materialName": "Test Material",
     "currentStock": 10,
     "threshold": 50,
     "unit": "units"
   }
   ```

2. **Quick Test**
   - Method: GET
   - URL: `http://localhost:5000/api/alert/test`
   - No body required

### Test from Frontend

The system automatically sends alerts when:
- Updating material stock in Inventory Alerts page
- Running stock check
- Manual trigger via API

## AWS SNS Pricing (India Region)

- **SMS**: ₹0.60 per message (approx)
- **Email**: Free (first 1000 emails/month)
- **Topic Creation**: Free
- **Subscriptions**: Free

For development/SIH demo:
- Keep subscribers to minimum
- Use test alerts sparingly
- Monitor AWS costs in console

## SIH Demonstration Points

1. **Live SMS Demo**
   - Show real-time SMS on mobile
   - Demonstrate email notification
   - Show AWS SNS console

2. **Automatic Triggering**
   - Update stock to trigger alert
   - Show console logs
   - Display SNS message ID

3. **Integration Benefits**
   - Real-time notifications
   - Multi-channel (SMS + Email)
   - Scalable to 1000s of users
   - Industry-standard AWS service

4. **Use Cases**
   - Field engineers get instant SMS
   - Managers receive email reports
   - Emergency alerts during outages
   - Auto-procurement notifications

## Security Best Practices

1. **Never commit `.env` to git**
   ```bash
   echo ".env" >> .gitignore
   ```

2. **Use IAM roles** (production)
   - Create SNS-only IAM user
   - Restrict permissions to SNS operations only

3. **Rotate credentials** regularly

4. **Use AWS Secrets Manager** (production)

## Troubleshooting

### Issue: "AWS_SNS_TOPIC_ARN not configured"
**Solution:** Add Topic ARN to `.env` file

### Issue: "The security token included in the request is invalid"
**Solution:** Check AWS credentials in `.env`

### Issue: "SMS not received"
**Solution:** 
- Verify phone number format (+91XXXXXXXXXX)
- Check AWS SNS sandbox mode (may need verification)
- Check AWS SNS quota limits

### Issue: "Email not received"
**Solution:**
- Check spam folder
- Confirm subscription via email link
- Verify email in SNS console

## Production Deployment

1. **Use AWS IAM Roles** instead of access keys
2. **Enable CloudWatch logging** for SNS
3. **Set up billing alerts** to monitor costs
4. **Use AWS Lambda** for advanced processing
5. **Implement rate limiting** to prevent abuse

## Code Structure

### snsService.js
- AWS SDK configuration
- Send functions (low stock, reorder, shortage)
- Subscribe functions (phone, email)

### snsAlertController.js
- API request validation
- Business logic (check thresholds)
- Error handling
- Response formatting

### snsAlert.js (routes)
- API endpoint definitions
- Route documentation
- Request mapping

## Integration with Existing System

The SNS service is integrated with:
- ✅ Inventory Alert System
- ✅ Material tracking
- ✅ Warehouse management
- ✅ Stock monitoring

**Trigger Points:**
1. `checkAndTriggerAlert()` in alertService.js
2. Material update API
3. Automated stock checks
4. Manual API calls

## Support

For issues or questions:
1. Check AWS SNS documentation
2. Verify credentials and configuration
3. Check console logs for errors
4. Test with simple GET /api/alert/test

---

**Ready for SIH Demonstration! 🚀**

This implementation follows AWS best practices and is production-ready for PowerGrid's material forecasting and stock monitoring system.
