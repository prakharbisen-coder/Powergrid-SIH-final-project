# ML Training Data Export

## Generated: 2025-12-03T10:17:27.864Z

## Datasets Created:

### 1. Cost Forecasting Training Data (2 records)
**File:** cost_forecasting_training_data.csv
**Purpose:** Train ML model to predict project costs based on infrastructure, location, and historical data
**Features:** 42 columns
**Target Variables:** actual_total_cost, cost_overrun, cost_overrun_percent

### 2. Project Budget Training Data (0 records)
**File:** project_budget_training_data.csv
**Purpose:** Train ML model for budget allocation and management
**Features:** 0 columns
**Target Variables:** budget_exceeded, overrun_amount, final_status

### 3. Material Cost Data (30 records)
**File:** material_cost_data.csv
**Purpose:** Track material prices and inventory for cost optimization
**Features:** 25 columns

### 4. Procurement Tax Data (0 records)
**File:** procurement_tax_data.csv
**Purpose:** Analyze tax impact on procurement costs
**Features:** 0 columns

### 5. Historical Forecast Data (51 records)
**File:** historical_forecast_data.csv
**Purpose:** Improve forecast accuracy using historical predictions
**Features:** 26 columns

### 6. Analytics Performance Data (72 records)
**File:** analytics_performance_data.csv
**Purpose:** Track performance metrics for optimization
**Features:** 20 columns

## Usage:

```bash
# Train models using Python
cd ml-service
python train_budget_models.py
```

This will create:
- cost_forecasting_model.pkl
- project_budget_model.pkl
- encoders.pkl (for categorical features)
- scaler.pkl (for numerical features)
