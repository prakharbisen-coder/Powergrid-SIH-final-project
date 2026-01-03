"""
Advanced Material Demand Forecasting & BOQ Validation Engine
Implements stacking ensemble (LightGBM, XGBoost, Random Forest) with comprehensive feature engineering
"""
from fastapi import HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import os
from sklearn.ensemble import RandomForestRegressor, StackingRegressor
from sklearn.linear_model import Ridge
import warnings
warnings.filterwarnings('ignore')

# Try importing ensemble libraries
try:
    import lightgbm as lgb
    LIGHTGBM_AVAILABLE = True
except ImportError:
    LIGHTGBM_AVAILABLE = False
    print("⚠️  LightGBM not available. Install with: pip install lightgbm")

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("⚠️  XGBoost not available. Install with: pip install xgboost")

# Model paths
ENCODERS_PATH = "encoders (4) new.pkl"
ENSEMBLE_MODEL_PATH = "ensemble_stack_model.pkl"
FEATURES_PATH = "features.pkl"

# ========================================
# PYDANTIC MODELS FOR API
# ========================================

class HistoricalDataPoint(BaseModel):
    """Single historical consumption data point"""
    date: str
    material_id: str
    consumed_quantity: float
    cumulative_consumed: Optional[float] = 0

class BOQInfo(BaseModel):
    """BOQ information for a specific material"""
    material_id: str
    material_name: str
    boq_quantity: float
    consumed_quantity: float
    unit: str

class AdvancedForecastInput(BaseModel):
    """Enhanced input model with all required features"""
    project_id: str
    project_name: str
    material_id: str
    
    # Project characteristics
    tower_count: int
    voltage: str
    tower_type: str
    terrain: str
    region: str
    
    # Time range
    start_date: str
    end_date: str
    forecast_days: Optional[int] = 30
    
    # Historical consumption data (required for lag/rolling features)
    historical_data: Optional[List[HistoricalDataPoint]] = []
    
    # BOQ data
    boq_data: Optional[List[BOQInfo]] = []
    
    # Additional context features
    lead_time: Optional[int] = 7  # days
    season: Optional[str] = None
    temperature: Optional[float] = None
    price_index: Optional[float] = 100.0
    holidays: Optional[int] = 0  # number of holidays in period

class DailyForecast(BaseModel):
    """Single day forecast output"""
    date: str
    predicted_qty: float
    cumulative_consumed: float
    remaining_boq_qty: float
    consumed_percentage: float
    boq_deficit_flag: int

class ForecastAlerts(BaseModel):
    """Alert flags for procurement"""
    understock: bool
    boq_deficit: bool
    vendor_notification: bool
    critical_shortage: bool
    messages: List[str]

class AdvancedForecastOutput(BaseModel):
    """Complete forecast output with BOQ validation"""
    project_id: str
    material_id: str
    material_name: str
    forecast_date: str
    forecast: List[DailyForecast]
    alerts: ForecastAlerts
    summary: Dict[str, Any]

# ========================================
# ADVANCED FORECASTING SERVICE
# ========================================

class AdvancedForecastingService:
    """Material Demand Forecasting with BOQ Validation"""
    
    def __init__(self):
        self.encoders = None
        self.ensemble_model = None
        self.features = None
        self.material_models = {}  # Per-material models
        self.load_resources()
    
    def load_resources(self):
        """Load encoders, features, and models"""
        # Load encoders
        if os.path.exists(ENCODERS_PATH):
            try:
                self.encoders = joblib.load(ENCODERS_PATH)
                print(f"✅ Encoders loaded: {list(self.encoders.keys()) if isinstance(self.encoders, dict) else 'OK'}")
            except Exception as e:
                print(f"⚠️  Error loading encoders: {e}")
        
        # Load features
        if os.path.exists(FEATURES_PATH):
            try:
                self.features = joblib.load(FEATURES_PATH)
                print(f"✅ Features loaded: {len(self.features) if isinstance(self.features, list) else 'OK'}")
            except Exception as e:
                print(f"⚠️  Error loading features: {e}")
        
        # Load ensemble model
        if os.path.exists(ENSEMBLE_MODEL_PATH):
            try:
                self.ensemble_model = joblib.load(ENSEMBLE_MODEL_PATH)
                print(f"✅ Ensemble model loaded from {ENSEMBLE_MODEL_PATH}")
            except Exception as e:
                print(f"⚠️  Error loading ensemble model: {e}")
        
        # Load per-material models if available
        material_types = ['steel', 'conductors', 'insulators', 'cement', 'nuts_bolts', 'earthing']
        for mat in material_types:
            model_path = f"models/{mat}_model.pkl"
            if os.path.exists(model_path):
                try:
                    self.material_models[mat] = joblib.load(model_path)
                    print(f"✅ {mat.title()} model loaded")
                except Exception as e:
                    print(f"⚠️  Could not load {mat} model: {e}")
    
    # ========================================
    # FEATURE ENGINEERING
    # ========================================
    
    def create_lag_features(self, df: pd.DataFrame, target_col: str = 'consumed_quantity', lags: List[int] = [1, 7, 14]) -> pd.DataFrame:
        """Create lag features for time series"""
        for lag in lags:
            df[f'lag_{lag}'] = df[target_col].shift(lag)
        return df
    
    def create_rolling_features(self, df: pd.DataFrame, target_col: str = 'consumed_quantity', windows: List[int] = [7, 14, 30]) -> pd.DataFrame:
        """Create rolling mean features"""
        for window in windows:
            df[f'rolling_mean_{window}'] = df[target_col].rolling(window=window, min_periods=1).mean()
            df[f'rolling_std_{window}'] = df[target_col].rolling(window=window, min_periods=1).std()
        return df
    
    def create_cyclical_features(self, df: pd.DataFrame, date_col: str = 'date') -> pd.DataFrame:
        """Create cyclical encoding for month/day"""
        df['month'] = pd.to_datetime(df[date_col]).dt.month
        df['day_of_week'] = pd.to_datetime(df[date_col]).dt.dayofweek
        df['day_of_month'] = pd.to_datetime(df[date_col]).dt.day
        
        # Cyclical encoding
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
        df['day_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['day_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        
        return df
    
    def create_trend_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create trend and time-based features"""
        df['time_index'] = np.arange(len(df))
        df['is_weekend'] = df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
        df['is_month_start'] = pd.to_datetime(df['date']).dt.is_month_start.astype(int)
        df['is_month_end'] = pd.to_datetime(df['date']).dt.is_month_end.astype(int)
        df['quarter'] = pd.to_datetime(df['date']).dt.quarter
        return df
    
    def create_boq_features(self, df: pd.DataFrame, boq_quantity: float) -> pd.DataFrame:
        """Create BOQ-related features"""
        if 'cumulative_consumed' in df.columns:
            df['boq_remaining'] = boq_quantity - df['cumulative_consumed']
            df['consumed_percent'] = (df['cumulative_consumed'] / boq_quantity * 100).clip(0, 100)
            df['boq_utilization_rate'] = df['cumulative_consumed'] / (df['time_index'] + 1)  # avg per day
        else:
            df['boq_remaining'] = boq_quantity
            df['consumed_percent'] = 0
            df['boq_utilization_rate'] = 0
        return df
    
    def engineer_features(self, df: pd.DataFrame, boq_quantity: float = 0) -> pd.DataFrame:
        """Apply all feature engineering steps"""
        df = df.copy()
        
        # Ensure date column is datetime
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date').reset_index(drop=True)
        
        # Create all features
        if 'consumed_quantity' in df.columns:
            df = self.create_lag_features(df)
            df = self.create_rolling_features(df)
        
        df = self.create_cyclical_features(df)
        df = self.create_trend_features(df)
        
        if boq_quantity > 0:
            df = self.create_boq_features(df, boq_quantity)
        
        # Fill NaN values with forward fill then backward fill
        df = df.fillna(method='ffill').fillna(method='bfill').fillna(0)
        
        return df
    
    def encode_categorical_features(self, df: pd.DataFrame, categorical_cols: List[str]) -> pd.DataFrame:
        """Encode categorical features using loaded encoders"""
        if not self.encoders:
            print("⚠️  No encoders loaded, using label encoding")
            for col in categorical_cols:
                if col in df.columns:
                    df[f'{col}_encoded'] = pd.Categorical(df[col]).codes
        else:
            for col in categorical_cols:
                if col in df.columns:
                    encoder_key = f'{col}_encoder'
                    if encoder_key in self.encoders:
                        encoder = self.encoders[encoder_key]
                        df[f'{col}_encoded'] = df[col].map(encoder).fillna(0)
                    else:
                        df[f'{col}_encoded'] = pd.Categorical(df[col]).codes
        return df
    
    # ========================================
    # STACKING ENSEMBLE MODEL
    # ========================================
    
    def create_stacking_ensemble(self):
        """Create stacking ensemble with LightGBM, XGBoost, Random Forest"""
        base_models = []
        
        # Add LightGBM if available
        if LIGHTGBM_AVAILABLE:
            lgb_model = lgb.LGBMRegressor(
                n_estimators=100,
                learning_rate=0.05,
                max_depth=7,
                random_state=42,
                verbosity=-1
            )
            base_models.append(('lightgbm', lgb_model))
        
        # Add XGBoost if available
        if XGBOOST_AVAILABLE:
            xgb_model = xgb.XGBRegressor(
                n_estimators=100,
                learning_rate=0.05,
                max_depth=7,
                random_state=42,
                verbosity=0
            )
            base_models.append(('xgboost', xgb_model))
        
        # Always add Random Forest
        rf_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        base_models.append(('random_forest', rf_model))
        
        # Meta-learner
        meta_learner = Ridge(alpha=1.0)
        
        # Create stacking ensemble
        if len(base_models) > 0:
            stacking_model = StackingRegressor(
                estimators=base_models,
                final_estimator=meta_learner,
                cv=3
            )
            print(f"✅ Stacking ensemble created with {len(base_models)} base models")
            return stacking_model
        else:
            print("⚠️  No models available for stacking, using Random Forest only")
            return rf_model
    
    # ========================================
    # PREDICTION & BOQ VALIDATION
    # ========================================
    
    def predict_demand(self, X: pd.DataFrame) -> np.ndarray:
        """Make predictions using loaded or created model"""
        # Use loaded ensemble model if available
        if self.ensemble_model is not None:
            try:
                predictions = self.ensemble_model.predict(X)
                # If predictions are log-transformed, apply inverse transform
                predictions = np.exp(predictions) - 1  # Inverse of log1p
                return np.maximum(predictions, 0)  # Ensure non-negative
            except Exception as e:
                print(f"⚠️  Ensemble model prediction failed: {e}")
        
        # Fallback: Use heuristic-based predictions
        print("📊 Using heuristic-based predictions")
        return self.heuristic_predictions(X)
    
    def heuristic_predictions(self, X: pd.DataFrame) -> np.ndarray:
        """Fallback heuristic predictions based on rolling means and trends"""
        predictions = []
        
        for idx, row in X.iterrows():
            # Base on rolling mean if available
            if 'rolling_mean_7' in row and not pd.isna(row['rolling_mean_7']) and row['rolling_mean_7'] > 0:
                pred = row['rolling_mean_7']
            elif 'lag_1' in row and not pd.isna(row['lag_1']) and row['lag_1'] > 0:
                pred = row['lag_1']
            else:
                # Default based on BOQ utilization
                if 'boq_utilization_rate' in row and row['boq_utilization_rate'] > 0:
                    pred = row['boq_utilization_rate']
                else:
                    pred = 100  # Default minimum
            
            # Add some variance
            pred = pred * np.random.uniform(0.95, 1.05)
            predictions.append(max(pred, 0))
        
        return np.array(predictions)
    
    def validate_with_boq(self, predictions: np.ndarray, boq_info: BOQInfo, 
                          historical_consumed: float = 0) -> tuple:
        """Validate predictions against BOQ and generate alerts"""
        boq_quantity = boq_info.boq_quantity
        consumed_quantity = boq_info.consumed_quantity or historical_consumed
        
        daily_forecasts = []
        cumulative = consumed_quantity
        alerts = []
        
        for day_idx, pred_qty in enumerate(predictions):
            cumulative += pred_qty
            remaining = boq_quantity - cumulative
            consumed_pct = (cumulative / boq_quantity * 100) if boq_quantity > 0 else 0
            deficit_flag = 1 if remaining < 0 else 0
            
            daily_forecasts.append({
                'predicted_qty': float(pred_qty),
                'cumulative_consumed': float(cumulative),
                'remaining_boq_qty': float(remaining),
                'consumed_percentage': float(consumed_pct),
                'boq_deficit_flag': deficit_flag
            })
            
            # Generate alerts
            if remaining < 0 and deficit_flag == 1:
                alerts.append(f"BOQ DEFICIT on day {day_idx + 1}: Shortage of {abs(remaining):.2f} {boq_info.unit}")
            elif 0 < remaining < (boq_quantity * 0.1):  # Less than 10% remaining
                alerts.append(f"LOW STOCK WARNING on day {day_idx + 1}: Only {remaining:.2f} {boq_info.unit} remaining")
        
        # Summary alerts
        final_remaining = boq_quantity - cumulative
        alert_obj = ForecastAlerts(
            understock=final_remaining < (boq_quantity * 0.1),
            boq_deficit=final_remaining < 0,
            vendor_notification=final_remaining < (boq_quantity * 0.2),
            critical_shortage=final_remaining < (boq_quantity * 0.05),
            messages=alerts[:5]  # Top 5 alerts
        )
        
        return daily_forecasts, alert_obj
    
    # ========================================
    # MAIN FORECAST GENERATION
    # ========================================
    
    async def generate_advanced_forecast(self, input_data: AdvancedForecastInput) -> AdvancedForecastOutput:
        """Generate comprehensive material demand forecast with BOQ validation"""
        try:
            print(f"\n🚀 Generating forecast for Project: {input_data.project_id}, Material: {input_data.material_id}")
            
            # Find BOQ info for this material
            boq_info = None
            for boq in input_data.boq_data:
                if boq.material_id == input_data.material_id:
                    boq_info = boq
                    break
            
            if not boq_info:
                raise HTTPException(status_code=400, detail=f"BOQ data not found for material {input_data.material_id}")
            
            print(f"📋 BOQ: {boq_info.boq_quantity} {boq_info.unit}, Consumed: {boq_info.consumed_quantity}")
            
            # Prepare historical data
            historical_df = pd.DataFrame([h.dict() for h in input_data.historical_data]) if input_data.historical_data else pd.DataFrame()
            
            # Create future dates for forecasting
            start_date = pd.to_datetime(input_data.start_date)
            future_dates = pd.date_range(start=start_date, periods=input_data.forecast_days, freq='D')
            future_df = pd.DataFrame({'date': future_dates})
            
            # Add project metadata
            future_df['project_id'] = input_data.project_id
            future_df['material_id'] = input_data.material_id
            future_df['voltage'] = input_data.voltage
            future_df['tower_type'] = input_data.tower_type
            future_df['terrain'] = input_data.terrain
            future_df['region'] = input_data.region
            future_df['tower_count'] = input_data.tower_count
            future_df['lead_time'] = input_data.lead_time
            future_df['price_index'] = input_data.price_index
            future_df['holidays'] = input_data.holidays
            
            # Combine historical + future for feature engineering
            if not historical_df.empty:
                combined_df = pd.concat([historical_df, future_df], ignore_index=True)
            else:
                combined_df = future_df.copy()
                combined_df['consumed_quantity'] = 0
                combined_df['cumulative_consumed'] = boq_info.consumed_quantity
            
            # Feature engineering
            combined_df = self.engineer_features(combined_df, boq_quantity=boq_info.boq_quantity)
            
            # Encode categorical features
            categorical_cols = ['voltage', 'tower_type', 'terrain', 'region']
            combined_df = self.encode_categorical_features(combined_df, categorical_cols)
            
            # Extract future rows only
            future_df_engineered = combined_df.tail(input_data.forecast_days).copy()
            
            # Select features for prediction (ensure correct order if features list exists)
            feature_cols = [col for col in future_df_engineered.columns if col not in ['date', 'project_id', 'material_id', 'consumed_quantity']]
            X_future = future_df_engineered[feature_cols].fillna(0)
            
            print(f"🔧 Feature matrix shape: {X_future.shape}")
            print(f"🔧 Features used: {list(X_future.columns)[:10]}...")  # Show first 10
            
            # Make predictions
            predictions = self.predict_demand(X_future)
            print(f"📈 Generated {len(predictions)} predictions, sample: {predictions[:5]}")
            
            # Validate with BOQ
            daily_forecasts, alerts = self.validate_with_boq(
                predictions, 
                boq_info, 
                historical_consumed=boq_info.consumed_quantity
            )
            
            # Convert to DailyForecast objects
            forecast_objects = []
            for i, daily in enumerate(daily_forecasts):
                forecast_objects.append(DailyForecast(
                    date=future_dates[i].strftime('%Y-%m-%d'),
                    **daily
                ))
            
            # Create summary
            total_forecasted = float(np.sum(predictions))
            final_consumed = boq_info.consumed_quantity + total_forecasted
            final_remaining = boq_info.boq_quantity - final_consumed
            
            summary = {
                'total_forecasted': total_forecasted,
                'total_boq_quantity': float(boq_info.boq_quantity),
                'already_consumed': float(boq_info.consumed_quantity),
                'final_cumulative': final_consumed,
                'final_remaining': final_remaining,
                'final_consumed_percentage': (final_consumed / boq_info.boq_quantity * 100) if boq_info.boq_quantity > 0 else 0,
                'forecast_days': input_data.forecast_days,
                'unit': boq_info.unit
            }
            
            # Return complete output
            return AdvancedForecastOutput(
                project_id=input_data.project_id,
                material_id=input_data.material_id,
                material_name=boq_info.material_name,
                forecast_date=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                forecast=forecast_objects,
                alerts=alerts,
                summary=summary
            )
            
        except Exception as e:
            print(f"❌ Error in forecast generation: {str(e)}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")

# Initialize service
advanced_service = AdvancedForecastingService()
