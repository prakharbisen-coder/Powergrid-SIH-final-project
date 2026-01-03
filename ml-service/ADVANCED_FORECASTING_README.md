# Advanced Material Demand Forecasting & BOQ Validation Engine

## Overview

This is an AI-driven forecasting system for PowerGrid that predicts material demand with BOQ (Bill of Quantities) validation. It uses a **Stacking Ensemble** approach with LightGBM, XGBoost, and Random Forest.

## Features

### 1. **Advanced Feature Engineering**
- **Lag Features**: lag_1, lag_7, lag_14 (previous consumption patterns)
- **Rolling Features**: rolling_mean_7, rolling_mean_14, rolling_std_7, rolling_std_14
- **Cyclical Features**: month_sin, month_cos, day_sin, day_cos (seasonal patterns)
- **Trend Features**: time_index, is_weekend, is_month_start, is_month_end, quarter
- **BOQ Features**: boq_remaining, consumed_percent, boq_utilization_rate

### 2. **Stacking Ensemble Model**
- **Base Models**: LightGBM, XGBoost, Random Forest
- **Meta-Learner**: Ridge Regression
- **Fallback**: Heuristic predictions if model unavailable

### 3. **BOQ Validation**
- Real-time deficit detection
- Remaining quantity tracking
- Consumed percentage calculation
- Multi-level alerts:
  - BOQ Deficit (remaining < 0)
  - Understock Warning (< 10% remaining)
  - Vendor Notification (< 20% remaining)
  - Critical Shortage (< 5% remaining)

## API Endpoints

### 1. **Generate Advanced Forecast**
```http
POST /forecast/advanced
```

**Request Body:**
```json
{
  "project_id": "PG-400KV-ODISHA01",
  "material_id": "M001",
  "forecast_days": 30,
  "historical_data": [
    {
      "date": "2025-01-01",
      "material_id": "M001",
      "consumed_quantity": 340,
      "cumulative_consumed": 10400
    }
  ],
  "boq_data": [
    {
      "material_id": "M001",
      "material_name": "Steel",
      "boq_quantity": 12000,
      "consumed_quantity": 10400,
      "unit": "MT"
    }
  ],
  "tower_count": 150,
  "voltage": "400kV",
  "tower_type": "400kV Lattice",
  "terrain": "Hilly",
  "region": "East",
  "start_date": "2025-02-01",
  "end_date": "2025-08-31",
  "lead_time": 7,
  "price_index": 105.5,
  "holidays": 2
}
```

**Response:**
```json
{
  "project_id": "PG-400KV-ODISHA01",
  "material_id": "M001",
  "material_name": "Steel",
  "forecast_date": "2025-12-09 10:30:00",
  "forecast": [
    {
      "date": "2025-02-01",
      "predicted_qty": 340,
      "cumulative_consumed": 10740,
      "remaining_boq_qty": 1260,
      "consumed_percentage": 89.5,
      "boq_deficit_flag": 0
    },
    {
      "date": "2025-02-02",
      "predicted_qty": 360,
      "cumulative_consumed": 11100,
      "remaining_boq_qty": 900,
      "consumed_percentage": 92.5,
      "boq_deficit_flag": 0
    }
  ],
  "alerts": {
    "understock": true,
    "boq_deficit": false,
    "vendor_notification": true,
    "critical_shortage": false,
    "messages": [
      "LOW STOCK WARNING on day 3: Only 600 MT remaining"
    ]
  },
  "summary": {
    "total_forecasted": 10200,
    "total_boq_quantity": 12000,
    "already_consumed": 10400,
    "final_cumulative": 20600,
    "final_remaining": -8600,
    "final_consumed_percentage": 171.67,
    "forecast_days": 30,
    "unit": "MT"
  }
}
```

### 2. **Backend API Endpoint**
```http
POST /api/forecasting/generate-advanced
Authorization: Bearer {token}
```

**Request:**
```json
{
  "projectId": "674ab8fbc8e9d8da23045678",
  "materialId": "Steel",
  "forecastDays": 30,
  "lead_time": 7,
  "price_index": 105,
  "holidays": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Advanced forecast generated successfully",
  "data": {
    "forecast_id": "674ab8fbc8e9d8da23045679",
    "project_id": "PG-400KV-ODISHA01",
    "material_id": "Steel",
    "material_name": "Steel",
    "forecast_date": "2025-12-09 10:30:00",
    "daily_forecasts": [...],
    "summary": {...},
    "alerts": {...},
    "boq_status": {
      "total_boq": 12000,
      "already_consumed": 10400,
      "forecasted_consumption": 10200,
      "final_remaining": -8600,
      "consumed_percentage": 171.67,
      "deficit": true
    }
  }
}
```

## Installation

### 1. **Install Python Dependencies**
```bash
cd ml-service
pip install -r requirements.txt
```

Required packages:
- `lightgbm==4.1.0`
- `xgboost==2.0.2`
- `scikit-learn==1.3.2`
- `pandas==2.1.3`
- `fastapi==0.104.1`

### 2. **Start Services**
```bash
# From project root
.\start-all.ps1
```

This starts:
- Backend API (port 5000)
- ML Service (port 8000)
- Frontend (port 8081)

## Usage

### Frontend Integration

```typescript
import { forecastAPI } from '@/services/api';

// Generate advanced forecast
const handleAdvancedForecast = async () => {
  const response = await forecastAPI.generateAdvancedForecast(
    projectId,      // Project ID
    'Steel',        // Material ID
    30,             // Forecast days
    {
      lead_time: 7,
      price_index: 105,
      holidays: 2
    }
  );
  
  const forecast = response.data.data;
  console.log('Daily Forecasts:', forecast.daily_forecasts);
  console.log('Alerts:', forecast.alerts);
  console.log('BOQ Status:', forecast.boq_status);
};
```

## Feature Engineering Details

### Lag Features
- `lag_1`: Yesterday's consumption
- `lag_7`: 7 days ago consumption
- `lag_14`: 14 days ago consumption

### Rolling Features
- `rolling_mean_7`: 7-day moving average
- `rolling_mean_14`: 14-day moving average
- `rolling_std_7`: 7-day standard deviation

### Cyclical Encoding
```python
month_sin = sin(2π * month / 12)
month_cos = cos(2π * month / 12)
```

### BOQ Features
- `boq_remaining = boq_quantity - cumulative_consumed`
- `consumed_percent = (cumulative / boq_quantity) * 100`
- `boq_utilization_rate = cumulative / time_index`

## Model Architecture

```
Input Features (30+ features)
         ↓
┌────────┴────────┐
│  LightGBM       │
│  XGBoost        │
│  Random Forest  │
└────────┬────────┘
         ↓
    Meta-Learner
    (Ridge Regression)
         ↓
    Final Prediction
         ↓
    BOQ Validation
         ↓
    Alerts & Summary
```

## BOQ Validation Logic

```python
for each predicted_day:
    cumulative += predicted_qty
    remaining = boq_quantity - cumulative
    
    if remaining < 0:
        alert = "BOQ DEFICIT"
    elif remaining < boq_quantity * 0.1:
        alert = "UNDERSTOCK WARNING"
    elif remaining < boq_quantity * 0.2:
        alert = "VENDOR NOTIFICATION"
```

## Troubleshooting

### Issue: Model not predicting correctly
**Check:**
1. Feature order matches training
2. Encoders loaded correctly
3. NaN values filled
4. Categorical features encoded
5. BOQ data merged properly

### Issue: ImportError for LightGBM/XGBoost
**Solution:**
```bash
pip install lightgbm xgboost
```

### Issue: BOQ data not found
**Solution:**
Ensure BOQ items exist for the project:
```javascript
// Add BOQ items via BOQDialog
await boqAPI.addItem(projectId, {
  itemCode: 'STEEL-001',
  itemName: 'Angle Steel',
  category: 'Steel',
  unit: 'MT',
  boqQuantity: 12000,
  consumedQuantity: 0
});
```

## Performance Tips

1. **Historical Data**: Provide at least 30 days for accurate lag features
2. **Feature Engineering**: All features auto-generated from historical data
3. **BOQ Accuracy**: Keep BOQ consumption updated for best results
4. **Caching**: Model loads once at startup for fast predictions

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────→│   Backend   │────→│  ML Service │
│  (React)    │     │  (Node.js)  │     │  (FastAPI)  │
└─────────────┘     └─────────────┘     └─────────────┘
                            │
                            ↓
                    ┌─────────────┐
                    │   MongoDB   │
                    │  (BOQ Data) │
                    └─────────────┘
```

## Files Modified

1. **ml-service/advanced_forecasting_service.py** - New advanced forecasting engine
2. **ml-service/main.py** - Added `/forecast/advanced` endpoint
3. **backend/controllers/forecastController.js** - Added `generateAdvancedForecast`
4. **backend/routes/forecasting.js** - Added `/generate-advanced` route
5. **src/services/api.ts** - Added `generateAdvancedForecast` method
6. **ml-service/requirements.txt** - Added LightGBM and XGBoost

## Next Steps

1. **Test with real data** - Use actual project consumption data
2. **Train custom models** - Train stacking ensemble on your historical data
3. **Fine-tune thresholds** - Adjust alert thresholds based on requirements
4. **Add more features** - Include weather, supplier delays, etc.
5. **Model persistence** - Save trained models for production use

## Support

For issues or questions, check:
- ML service logs: Check terminal running ML service
- Backend logs: Check backend terminal
- Network: Ensure all services running on correct ports
