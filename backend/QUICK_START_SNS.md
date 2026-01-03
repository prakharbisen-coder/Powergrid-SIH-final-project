# AWS SNS Integration - Quick Start Guide

## ✅ What Has Been Implemented

### Backend Files Created:
1. **`services/snsService.js`** - AWS SNS service layer
2. **`controllers/snsAlertController.js`** - API request handlers
3. **`routes/snsAlert.js`** - API endpoints
4. **`test-sns-config.js`** - Configuration testing script
5. **`AWS_SNS_SETUP.md`** - Complete documentation

### Features Implemented:
- ✅ Low stock alerts (SMS + Email)
- ✅ Auto-reorder notifications
- ✅ Material shortage alerts
- ✅ Phone/Email subscription management
- ✅ Automatic integration with inventory system
- ✅ SIH demonstration-ready test endpoint

## 🚀 Quick Start

### 1. Test Current Setup (Without AWS Credentials)
```bash
cd backend
node test-sns-config.js
```

This will show you what needs to be configured.

### 2. Configure AWS SNS (For Real Notifications)

#### Step 1: Get AWS Credentials
1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to IAM → Users → Create User
3. Grant **AmazonSNSFullAccess** permission
4. Create Access Key
5. Copy **Access Key ID** and **Secret Access Key**

#### Step 2: Create SNS Topic
1. Go to AWS Console → SNS
2. Click "Create topic"
3. Name: `PowerGrid-Alerts`
4. Type: Standard
5. Copy the Topic ARN (e.g., `arn:aws:sns:ap-south-1:123456789012:PowerGrid-Alerts`)

#### Step 3: Update .env File
Open `backend/.env` and update:
```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_SNS_TOPIC_ARN=arn:aws:sns:ap-south-1:123456789012:PowerGrid-Alerts
```

#### Step 4: Subscribe to Alerts
```bash
# Subscribe your phone
curl -X POST http://localhost:5000/api/alert/subscribe/phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+91XXXXXXXXXX"}'

# Subscribe your email
curl -X POST http://localhost:5000/api/alert/subscribe/email \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com"}'
```

#### Step 5: Test
```bash
# Send test alert
curl http://localhost:5000/api/alert/test
```

You should receive SMS and/or Email!

## 📱 API Endpoints

### 1. Send Low Stock Alert
```bash
POST http://localhost:5000/api/alert/send
Content-Type: application/json

{
  "substationName": "Substation A",
  "materialName": "Disc Insulators",
  "currentStock": 20,
  "threshold": 100,
  "unit": "units"
}
```

**Example Message:**
```
⚠️ LOW STOCK ALERT
🏭 Location: Substation A
📦 Material: Disc Insulators
📊 Current Stock: 20 units
📈 Required: 100 units
🔻 Shortage: 80 units
```

### 2. Test Alert (SIH Demo)
```bash
GET http://localhost:5000/api/alert/test
```

### 3. Auto-Reorder Notification
```bash
POST http://localhost:5000/api/alert/auto-reorder

{
  "warehouseName": "Nagpur Central",
  "materialName": "Tower Parts",
  "quantity": 500,
  "supplier": "Steel India",
  "estimatedCost": 250000
}
```

### 4. Material Shortage Alert
```bash
POST http://localhost:5000/api/alert/shortage

{
  "substationName": "Substation B",
  "materialName": "Conductors",
  "requiredQuantity": 1000,
  "availableQuantity": 200
}
```

## 🔗 Automatic Integration

The SNS notifications are **automatically triggered** when:

1. **Inventory Alert System** detects low stock
2. **Material quantity updated** below threshold
3. **Stock check runs** and finds issues

No manual API calls needed - it happens automatically!

## 💰 AWS SNS Pricing (India)

- **SMS**: ~₹0.60 per message
- **Email**: Free (first 1000/month)
- **Subscriptions**: Free
- **Topic Creation**: Free

**For SIH Demo:** Keep it minimal, costs will be negligible.

## 🎯 SIH Demonstration Points

### Live Demo Flow:
1. **Show Configuration**
   ```bash
   node backend/test-sns-config.js
   ```

2. **Send Test Alert**
   ```bash
   curl http://localhost:5000/api/alert/test
   ```

3. **Show Real SMS/Email** on mobile device

4. **Trigger Automatic Alert**
   - Go to Inventory Alerts page
   - Update material stock below threshold
   - Show SMS received automatically

5. **Show AWS Console**
   - Display SNS topic
   - Show CloudWatch metrics
   - Show delivery status

### Talking Points:
- ✅ Industry-standard AWS service
- ✅ Real-time notifications
- ✅ Scalable to 1000s of users
- ✅ Multi-channel (SMS + Email)
- ✅ Automatic integration
- ✅ Production-ready code

## 🛠️ Troubleshooting

### SNS Not Configured (Development Mode)
The system works fine without AWS SNS! It will:
- Show console logs
- Return alert data via API
- Skip SNS notification gracefully

### Common Issues:

**"AWS_SNS_TOPIC_ARN not configured"**
→ Add Topic ARN to `.env` file

**"Invalid credentials"**
→ Check AWS Access Key in `.env`

**"SMS not received"**
→ Check phone format: +91XXXXXXXXXX
→ Verify AWS sandbox mode
→ Confirm subscription

**"Email not received"**
→ Check spam folder
→ Confirm subscription via email link

## 📂 File Locations

```
backend/
├── services/
│   └── snsService.js              # AWS SNS implementation
├── controllers/
│   └── snsAlertController.js      # API handlers
├── routes/
│   └── snsAlert.js                # API endpoints
├── .env                           # AWS credentials HERE
├── test-sns-config.js             # Test script
├── AWS_SNS_SETUP.md               # Full documentation
└── QUICK_START_SNS.md             # This file
```

## 🎓 For SIH Judges/Mentors

This implementation demonstrates:

1. **Cloud Integration**: AWS SNS for enterprise notifications
2. **Best Practices**: 
   - Separation of concerns (service/controller/routes)
   - Environment variable configuration
   - Error handling and logging
   - API documentation

3. **Real-World Ready**:
   - Works with/without AWS (graceful fallback)
   - Automatic integration with business logic
   - Multiple notification types
   - Subscription management

4. **Scalability**:
   - Handles 1000s of subscribers
   - AWS infrastructure reliability
   - Multi-channel delivery

## 🔐 Security Notes

- ✅ Credentials in `.env` (never committed to git)
- ✅ `.env` already in `.gitignore`
- ✅ IAM-based access control
- ✅ Least-privilege permissions recommended

## 📞 Support

For detailed setup: See `backend/AWS_SNS_SETUP.md`

Test configuration: `node backend/test-sns-config.js`

---

**Status: ✅ Fully Implemented and SIH-Ready!**

The system will work immediately - with or without AWS credentials. Configure AWS SNS to enable real SMS/Email notifications for live demonstration.
