# 🔒 MATERIAL VALIDATION SYSTEM
## PowerGrid Material Approval & Procurement Control

### 📋 TABLE OF CONTENTS
1. [Overview](#overview)
2. [Why This Matters](#why-this-matters)
3. [System Architecture](#system-architecture)
4. [API Endpoints](#api-endpoints)
5. [Usage Examples](#usage-examples)
6. [Integration Guide](#integration-guide)
7. [Testing](#testing)

---

## 📖 OVERVIEW

The Material Validation System ensures that only **PowerGrid-approved materials** can be added to inventory, preventing unauthorized procurement, cost overruns, and quality issues.

### Key Features
✅ **Automatic Validation** - All material add/update operations are validated  
✅ **Approved Materials Database** - 27+ pre-approved materials with IS/IEC specifications  
✅ **Bulk Upload Protection** - CSV/Excel imports reject invalid materials  
✅ **Real-time Feedback** - Clear error messages for rejected materials  
✅ **Category Management** - Materials organized by 11 PowerGrid categories  

---

## 🎯 WHY THIS MATTERS

### 1. PREVENTS COST OVERRUNS
**Problem:** Unapproved materials have no pre-negotiated vendor rates  
**Solution:** Only materials with established supplier contracts are allowed

**Example:**
```
❌ REJECTED: "Wooden Plank" - ₹500/piece (market rate, no negotiation)
✅ APPROVED: "Tower Bolt M16" - ₹45/piece (vendor contract rate)
💰 Savings: ₹455 per unit × 10,000 units = ₹45.5 Lakhs saved
```

### 2. ENSURES QUALITY STANDARDS
**Problem:** Substandard materials can cause infrastructure failures  
**Solution:** All approved materials are IS/IEC certified

**Example:**
```
❌ REJECTED: "Generic Copper Wire" - No specifications, unknown quality
✅ APPROVED: "ACSR Conductor Moose" - IEC 61089 certified, 13600kg breaking load
🔒 Quality: Prevents line failures that cost ₹50+ Lakhs per incident
```

### 3. STREAMLINES PROCUREMENT
**Problem:** Each unapproved material requires technical committee review (4-6 weeks)  
**Solution:** Approved materials bypass review process

**Example:**
```
⏱️  Unapproved Material: 4-6 weeks approval + procurement = 8-10 weeks
⚡ Approved Material: Direct procurement = 2-3 weeks
📈 Efficiency: 70% faster procurement cycle
```

### 4. REGULATORY COMPLIANCE
**Problem:** CEA and government audits require justified procurement  
**Solution:** Approved materials have documented technical justification

**Example:**
```
✅ Audit Trail: "Tower Bolt M16 - IS 1367 certified, Tech Committee approved 2023-01-15"
❌ Audit Issue: "Wooden Plank - No standard, no approval date, no justification"
```

---

## 🏗️ SYSTEM ARCHITECTURE

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT REQUEST                          │
│          POST /api/materials/add {name: "Material X"}       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              VALIDATION MIDDLEWARE                          │
│  1. Extract material name from request                      │
│  2. Query ApprovedMaterial.isApproved(name)                 │
│  3. If approved → continue to controller                    │
│  4. If rejected → return 400 error with details             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│          APPROVED MATERIALS DATABASE                        │
│  MongoDB Collection: approved_materials                      │
│  - materialName (unique, indexed)                           │
│  - category (enum: 11 types)                                │
│  - specifications (IS/IEC standards)                        │
│  - standardCode (e.g., IS-1367-M16-8.8)                     │
│  - isActive (boolean)                                       │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

```javascript
ApprovedMaterial Schema:
{
  materialName: String (unique, text-indexed)
  category: Enum [
    'Tower Parts', 'Conductors', 'Insulators', 'Hardware',
    'Circuit Breakers', 'Transformers', 'Steel Structures',
    'Foundation Materials', 'Earthing Materials', 
    'Protection Equipment', 'Cables'
  ]
  specifications: {
    standard: String,      // e.g., "IS 1367", "IEC 60305"
    grade: String,         // e.g., "8.8", "E250"
    // Other technical specs...
  }
  standardCode: String,    // e.g., "IS-1367-M16-8.8"
  unit: String,            // e.g., "PCS", "MTR", "KG"
  description: String,
  isActive: Boolean,
  approvalDate: Date,
  deactivationDate: Date,
  deactivationReason: String
}
```

---

## 🔌 API ENDPOINTS

### 1. Add Approved Material
**POST** `/api/approved/add`

Add new material to approved list (admin only)

**Request Body:**
```json
{
  "materialName": "Tower Bolt M16",
  "category": "Tower Parts",
  "specifications": {
    "standard": "IS 1367",
    "grade": "8.8",
    "diameter": "16mm"
  },
  "standardCode": "IS-1367-M16-8.8",
  "unit": "PCS",
  "description": "High tensile bolt for tower assembly"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Material added to approved list",
  "material": { /* Material object */ }
}
```

---

### 2. Get All Approved Materials
**GET** `/api/approved/all`

Retrieve all approved materials with optional filtering

**Query Parameters:**
- `category` (optional) - Filter by category
- `isActive` (optional) - Filter by active status (default: true)

**Example:**
```bash
GET /api/approved/all?category=Conductors&isActive=true
```

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "materials": [
    {
      "_id": "...",
      "materialName": "ACSR Conductor Moose",
      "category": "Conductors",
      "specifications": {
        "standard": "IEC 61089",
        "codeWord": "Moose",
        "breakingLoad": "13600 kg"
      },
      "standardCode": "IEC-61089-MOOSE",
      "unit": "MTR",
      "isActive": true
    }
  ]
}
```

---

### 3. Validate Material
**POST** `/api/material/validate`

Check if material is approved before adding to inventory

**Request Body:**
```json
{
  "materialName": "Tower Bolt M16"
}
```

**Response - APPROVED (200):**
```json
{
  "success": true,
  "valid": true,
  "status": "APPROVED",
  "material": "Tower Bolt M16",
  "message": "Material is approved for use in PowerGrid projects",
  "details": {
    "category": "Tower Parts",
    "standardCode": "IS-1367-M16-8.8",
    "specifications": { /* ... */ }
  }
}
```

**Response - REJECTED (200):**
```json
{
  "success": false,
  "valid": false,
  "status": "INVALID_MATERIAL",
  "material": "Wooden Plank",
  "message": "This material is not required for this project and cannot be added to inventory.",
  "reason": "Material not found in PowerGrid approved materials database"
}
```

---

### 4. Search Approved Materials
**GET** `/api/approved/search`

Full-text search across approved materials

**Query Parameters:**
- `q` (required) - Search query (min 2 characters)
- `category` (optional) - Filter by category

**Example:**
```bash
GET /api/approved/search?q=Tower&category=Tower%20Parts
```

**Response (200):**
```json
{
  "success": true,
  "query": "Tower",
  "count": 2,
  "materials": [
    {
      "materialName": "Tower Bolt M16",
      "category": "Tower Parts",
      /* ... */
    },
    {
      "materialName": "Tower Leg Angle 150x150x18",
      "category": "Tower Parts",
      /* ... */
    }
  ]
}
```

---

### 5. Deactivate Material
**PUT** `/api/approved/:id/deactivate`

Deactivate material (admin only) - material remains in database but is no longer approved

**Request Body:**
```json
{
  "reason": "Replaced by newer specification IS 1367-2020"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Material deactivated",
  "material": {
    "_id": "...",
    "materialName": "Tower Bolt M16",
    "isActive": false,
    "deactivationDate": "2024-01-15T10:30:00.000Z",
    "deactivationReason": "Replaced by newer specification IS 1367-2020"
  }
}
```

---

### 6. Get Material Categories
**GET** `/api/approved/categories`

Get list of all material categories

**Response (200):**
```json
{
  "success": true,
  "count": 11,
  "categories": [
    "Cables",
    "Circuit Breakers",
    "Conductors",
    "Earthing Materials",
    "Foundation Materials",
    "Hardware",
    "Insulators",
    "Protection Equipment",
    "Steel Structures",
    "Tower Parts",
    "Transformers"
  ]
}
```

---

## 💻 USAGE EXAMPLES

### Example 1: Adding Approved Material (SUCCESS)

```javascript
// Request
const response = await fetch('http://localhost:5000/api/materials/add', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    materialName: 'Tower Bolt M16',
    quantity: 5000,
    location: 'Nagpur Warehouse',
    minQty: 1000
  })
});

// Response (201 Created)
{
  "success": true,
  "message": "Material added successfully",
  "material": {
    "materialName": "Tower Bolt M16",
    "quantity": 5000,
    "approvedDetails": {
      "category": "Tower Parts",
      "standardCode": "IS-1367-M16-8.8",
      "specifications": { /* ... */ }
    }
  }
}

// Console Output
✅ APPROVED: Material "Tower Bolt M16" validated successfully
```

---

### Example 2: Adding Unapproved Material (REJECTED)

```javascript
// Request
const response = await fetch('http://localhost:5000/api/materials/add', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    materialName: 'Wooden Plank',
    quantity: 100,
    location: 'Nagpur Warehouse'
  })
});

// Response (400 Bad Request)
{
  "success": false,
  "status": "INVALID_MATERIAL",
  "material": "Wooden Plank",
  "message": "This material is not required for this project and cannot be added to inventory.",
  "reason": "Material not found in PowerGrid approved materials database",
  "action": "Please contact procurement department to add this material to approved list",
  "helpText": "Only IS/IEC certified materials approved by PowerGrid technical committee can be added to inventory"
}

// Console Output
❌ REJECTED: Invalid material "Wooden Plank"
Reason: Not in PowerGrid approved materials list
```

---

### Example 3: Bulk Material Upload with Validation

```javascript
// CSV Upload with validation
const materials = [
  { materialName: 'Tower Bolt M16', quantity: 5000 },
  { materialName: 'Wooden Plank', quantity: 100 },  // Will be rejected
  { materialName: 'ACSR Conductor Moose', quantity: 2000 }
];

const response = await fetch('http://localhost:5000/api/materials/bulk-add', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({ materials })
});

// Response (200 OK)
{
  "success": true,
  "summary": {
    "total": 3,
    "approved": 2,
    "rejected": 1
  },
  "approved": [
    { "materialName": "Tower Bolt M16", "quantity": 5000 },
    { "materialName": "ACSR Conductor Moose", "quantity": 2000 }
  ],
  "rejected": [
    {
      "material": "Wooden Plank",
      "reason": "Not in PowerGrid approved materials list"
    }
  ]
}

// Console Output
📊 Bulk Validation Results:
   Total: 3
   ✅ Approved: 2
   ❌ Rejected: 1
```

---

## 🔧 INTEGRATION GUIDE

### Step 1: Seed Approved Materials Database

```bash
# Run seeding script
cd backend
node seedApprovedMaterials.js
```

**Expected Output:**
```
✅ MongoDB connected

🗑️  Clearing existing approved materials...
✅ Cleared

📦 Inserting approved materials...
   ✅ Tower Bolt M16
   ✅ Tower Leg Angle 150x150x18
   ✅ ACSR Conductor Moose
   ... (27 items total)

✅ Successfully seeded 27 approved materials

📊 Category Breakdown:
   Tower Parts: 3 items
   Conductors: 3 items
   Insulators: 3 items
   Hardware: 3 items
   Circuit Breakers: 2 items
   Transformers: 2 items
   Steel Structures: 2 items
   Foundation Materials: 2 items
   Earthing Materials: 2 items
   Protection Equipment: 2 items
   Cables: 2 items

✅ Database seeding complete!
```

---

### Step 2: Test Material Validation

```bash
# Test approved material
curl -X POST http://localhost:5000/api/material/validate \
  -H "Content-Type: application/json" \
  -d '{"materialName": "Tower Bolt M16"}'

# Test rejected material
curl -X POST http://localhost:5000/api/material/validate \
  -H "Content-Type: application/json" \
  -d '{"materialName": "Wooden Plank"}'
```

---

### Step 3: Update Frontend Forms

Add validation check before submitting material forms:

```javascript
// src/components/AddMaterialForm.tsx
const validateMaterial = async (materialName) => {
  const response = await fetch('http://localhost:5000/api/material/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ materialName })
  });
  
  const result = await response.json();
  
  if (!result.valid) {
    alert(`❌ ${result.message}\n\nReason: ${result.reason}`);
    return false;
  }
  
  return true;
};

const handleSubmit = async (formData) => {
  // Validate before submitting
  const isValid = await validateMaterial(formData.materialName);
  if (!isValid) return;
  
  // Proceed with add
  const response = await fetch('http://localhost:5000/api/materials/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  // ...
};
```

---

### Step 4: Integrate with Forecasting

Update forecasting service to only predict approved materials:

```javascript
// backend/controllers/forecastController.js
const getApprovedMaterials = async () => {
  const approvedMaterials = await ApprovedMaterial.find({ isActive: true });
  const approvedNames = approvedMaterials.map(m => m.materialName);
  return approvedNames;
};

exports.generateForecast = async (req, res) => {
  const approvedNames = await getApprovedMaterials();
  
  // Filter materials to only include approved ones
  const materials = await Material.find({
    materialName: { $in: approvedNames }
  });
  
  // Send to ML service for forecasting
  // ...
};
```

---

## 🧪 TESTING

### Test Suite

```bash
# 1. Seed database
node backend/seedApprovedMaterials.js

# 2. Test validation endpoint
curl -X POST http://localhost:5000/api/material/validate \
  -H "Content-Type: application/json" \
  -d '{"materialName": "Tower Bolt M16"}'

# 3. Test approved material addition
curl -X POST http://localhost:5000/api/materials/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "materialName": "Tower Bolt M16",
    "quantity": 5000,
    "location": "Nagpur"
  }'

# 4. Test rejected material addition
curl -X POST http://localhost:5000/api/materials/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "materialName": "Wooden Plank",
    "quantity": 100,
    "location": "Nagpur"
  }'

# Expected: 400 error with "INVALID_MATERIAL" status

# 5. Get all approved materials
curl http://localhost:5000/api/approved/all

# 6. Search materials
curl "http://localhost:5000/api/approved/search?q=Tower"

# 7. Get categories
curl http://localhost:5000/api/approved/categories
```

---

### Test Cases

| Test Case | Material Name | Expected Result | Status Code |
|-----------|--------------|-----------------|-------------|
| Valid approved material | Tower Bolt M16 | ✅ APPROVED | 201 |
| Invalid material | Wooden Plank | ❌ REJECTED | 400 |
| Valid conductor | ACSR Conductor Moose | ✅ APPROVED | 201 |
| Vague description | Generic Wire | ❌ REJECTED | 400 |
| Valid insulator | Disc Insulator 160kN | ✅ APPROVED | 201 |
| Non-electrical item | Plastic Chair | ❌ REJECTED | 400 |

---

## 🎓 TRAINING & DOCUMENTATION

### For Procurement Team

**When to Add New Approved Material:**
1. Technical committee approves new specification
2. Vendor contract is finalized
3. IS/IEC certification is verified
4. Use POST `/api/approved/add` endpoint

**When Material is Rejected:**
1. Inform requestor of rejection reason
2. Suggest approved alternative if available
3. Initiate technical committee review if material is genuinely needed
4. Track approval process in separate system

---

### For Warehouse Staff

**If Material Addition Fails:**
1. Check error message - it will clearly state reason
2. Verify material name matches approved list exactly
3. Search approved materials: GET `/api/approved/search?q=YourMaterial`
4. Contact procurement if material should be approved

---

## 📞 SUPPORT

For issues or questions:
- **Technical Issues:** Check backend logs for validation messages
- **New Material Approvals:** Contact procurement department
- **System Errors:** Check MongoDB connection and approved_materials collection

---

## 📊 METRICS & MONITORING

Track these metrics for procurement efficiency:

```javascript
// Dashboard metrics
const metrics = {
  totalApprovedMaterials: 27,
  activeCategories: 11,
  rejectedAttempts: 0,  // Track invalid material attempts
  approvalTime: '2-3 weeks',  // vs 8-10 weeks for unapproved
  costSavings: '₹45.5 Lakhs',  // From negotiated rates
  qualityIncidents: 0  // Zero incidents with approved materials
};
```

---

## ✅ SUCCESS INDICATORS

System is working correctly when:
- ✅ All 27 materials seeded successfully
- ✅ "Tower Bolt M16" passes validation
- ✅ "Wooden Plank" is rejected with clear message
- ✅ Material additions fail fast with 400 error
- ✅ Approved materials display in frontend dropdown
- ✅ Bulk uploads separate approved/rejected materials

---

**🎉 Material Validation System is now ready to protect PowerGrid from unauthorized procurement!**
