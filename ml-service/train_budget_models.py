"""
Budget Optimization ML Models Training Script

Creates two main models:
1. Cost Forecasting Model - Predicts project costs
2. Project Budget Model - Predicts budget overruns and allocations

Output: .pkl files for production use
"""

import pandas as pd
import numpy as np
import joblib
import os
from datetime import datetime
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import LabelEncoder, StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, RandomForestClassifier
from sklearn.linear_model import Ridge, LogisticRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, accuracy_score, classification_report
import xgboost as xgb
import lightgbm as lgb
import warnings
warnings.filterwarnings('ignore')

# Create models directory
os.makedirs('models', exist_ok=True)
os.makedirs('models/budget_optimization', exist_ok=True)

print("=" * 80)
print("BUDGET OPTIMIZATION ML MODEL TRAINING")
print("=" * 80)

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def load_data(filename):
    """Load CSV data from ml-data-export folder"""
    filepath = os.path.join('..', 'backend', 'ml-data-export', filename)
    if not os.path.exists(filepath):
        print(f"⚠️  Warning: {filename} not found")
        return None
    
    try:
        df = pd.read_csv(filepath)
        print(f"✅ Loaded: {filename}")
        return df
    except pd.errors.EmptyDataError:
        print(f"⚠️  Warning: {filename} is empty")
        return None
    except Exception as e:
        print(f"⚠️  Warning: Error loading {filename}: {str(e)}")
        return None

def preprocess_categorical(df, categorical_cols, encoder_dict=None):
    """Encode categorical variables"""
    if encoder_dict is None:
        encoder_dict = {}
    
    for col in categorical_cols:
        if col in df.columns:
            if col not in encoder_dict:
                encoder_dict[col] = LabelEncoder()
                df[col] = encoder_dict[col].fit_transform(df[col].astype(str))
            else:
                df[col] = encoder_dict[col].transform(df[col].astype(str))
    
    return df, encoder_dict

def evaluate_regression_model(model, X_test, y_test, model_name):
    """Evaluate regression model performance"""
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print(f"\n{model_name} Performance:")
    print(f"  MAE: ₹{mae:,.2f}")
    print(f"  RMSE: ₹{rmse:,.2f}")
    print(f"  R² Score: {r2:.4f}")
    
    return {'mae': mae, 'rmse': rmse, 'r2': r2, 'predictions': y_pred}

def evaluate_classification_model(model, X_test, y_test, model_name):
    """Evaluate classification model performance"""
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\n{model_name} Performance:")
    print(f"  Accuracy: {accuracy:.4f}")
    print(f"\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    return {'accuracy': accuracy, 'predictions': y_pred}

# ============================================================================
# MODEL 1: COST FORECASTING MODEL
# ============================================================================

def train_cost_forecasting_model():
    """
    Train Cost Forecasting Model
    Predicts total project cost based on infrastructure and location features
    """
    print("\n" + "=" * 80)
    print("1️⃣  COST FORECASTING MODEL")
    print("=" * 80)
    
    # Load data
    df = load_data('cost_forecasting_training_data.csv')
    if df is None or len(df) == 0:
        print("❌ No data available for cost forecasting model")
        return None
    
    print(f"\n📊 Dataset: {len(df)} projects")
    print(f"📊 Features: {len(df.columns)} columns")
    
    # Feature engineering
    print("\n🔧 Feature Engineering...")
    
    # Define feature groups
    categorical_features = [
        'region', 'terrain', 'tower_type', 'substation_type', 
        'voltage_level', 'project_status', 'rainfall_level', 
        'project_overall_status', 'financial_year'
    ]
    
    numerical_features = [
        'tower_count', 'substation_count', 'line_length_km', 'duration_days',
        'gst_percent', 'transport_cost', 'state_taxes', 'custom_duty',
        'avg_temperature', 'cyclone_prone', 'contractor_rating',
        'steel_cost', 'conductor_cost', 'insulator_cost', 'cement_cost',
        'earthing_cost', 'other_material_cost'
    ]
    
    # Fill missing values
    for col in numerical_features:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())
    
    for col in categorical_features:
        if col in df.columns:
            df[col] = df[col].fillna('Unknown')
    
    # Encode categorical variables
    df_processed, encoders = preprocess_categorical(
        df.copy(), 
        categorical_features
    )
    
    # Prepare features and target
    feature_cols = [col for col in categorical_features + numerical_features if col in df_processed.columns]
    X = df_processed[feature_cols]
    
    # Target: actual total cost
    y = df_processed['actual_total_cost'].fillna(df_processed['total_budget'])
    
    print(f"✅ Features: {len(feature_cols)}")
    print(f"✅ Target: actual_total_cost")
    
    # Split data - adjust test size based on data available
    test_size = 0.2 if len(X) >= 20 else 0.3 if len(X) >= 10 else 0.5
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42
    )
    
    print(f"\n📊 Training set: {len(X_train)} samples")
    print(f"📊 Test set: {len(X_test)} samples")
    
    # Check if we have enough data
    if len(X_train) < 10:
        print("\n⚠️  WARNING: Not enough training data (< 10 samples)")
        print("💡 Generating synthetic data to supplement training...")
        
        # Generate synthetic data based on existing samples
        n_synthetic = 50
        synthetic_samples = []
        
        for _ in range(n_synthetic):
            # Pick a random base sample
            base_idx = np.random.randint(0, len(X_train))
            synthetic_sample = X_train.iloc[base_idx].copy()
            
            # Add random variations to numerical features
            for col in numerical_features:
                if col in synthetic_sample.index:
                    # Add ±20% variation
                    variation = np.random.uniform(0.8, 1.2)
                    synthetic_sample[col] = synthetic_sample[col] * variation
            
            synthetic_samples.append(synthetic_sample)
            
            # Generate corresponding target with some noise
            base_target = y_train.iloc[base_idx]
            synthetic_target = base_target * np.random.uniform(0.85, 1.15)
            y_train = pd.concat([y_train, pd.Series([synthetic_target])], ignore_index=True)
        
        # Add synthetic samples to training data
        X_train = pd.concat([X_train, pd.DataFrame(synthetic_samples)], ignore_index=True)
        print(f"✅ Added {n_synthetic} synthetic samples")
        print(f"📊 New training set size: {len(X_train)} samples")
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train multiple models
    print("\n🤖 Training Models...")
    
    models = {
        'Random Forest': RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1),
        'XGBoost': xgb.XGBRegressor(n_estimators=100, max_depth=7, learning_rate=0.1, random_state=42),
        'LightGBM': lgb.LGBMRegressor(n_estimators=100, max_depth=7, learning_rate=0.1, random_state=42, verbose=-1),
        'Gradient Boosting': GradientBoostingRegressor(n_estimators=100, max_depth=7, learning_rate=0.1, random_state=42)
    }
    
    results = {}
    best_model = None
    best_r2 = -np.inf
    
    for name, model in models.items():
        print(f"\nTraining {name}...")
        model.fit(X_train_scaled, y_train)
        result = evaluate_regression_model(model, X_test_scaled, y_test, name)
        results[name] = result
        
        # Handle NaN R² scores
        r2_score = result['r2'] if not np.isnan(result['r2']) else -np.inf
        if r2_score > best_r2:
            best_r2 = r2_score
            best_model = (name, model)
    
    # Select best model - if all failed, use Random Forest
    if best_model is None or best_r2 == -np.inf:
        print("\n⚠️  All models have undefined R² scores (likely due to small test set)")
        print("🎯 Selecting Random Forest as default model")
        best_model = ('Random Forest', models['Random Forest'])
        best_r2 = 0.0
    
    # Select best model
    print(f"\n🏆 Best Model: {best_model[0]} (R² = {best_r2:.4f})")
    
    # Feature importance
    if hasattr(best_model[1], 'feature_importances_'):
        importances = best_model[1].feature_importances_
        feature_importance = pd.DataFrame({
            'feature': feature_cols,
            'importance': importances
        }).sort_values('importance', ascending=False)
        
        print("\n📊 Top 10 Most Important Features:")
        print(feature_importance.head(10).to_string(index=False))
    
    # Save model and artifacts
    model_artifacts = {
        'model': best_model[1],
        'scaler': scaler,
        'encoders': encoders,
        'feature_cols': feature_cols,
        'categorical_features': categorical_features,
        'numerical_features': numerical_features,
        'model_name': best_model[0],
        'performance': results[best_model[0]],
        'training_date': datetime.now().isoformat(),
        'n_samples': len(df)
    }
    
    joblib.dump(model_artifacts, 'models/budget_optimization/cost_forecasting_model.pkl')
    print("\n✅ Saved: cost_forecasting_model.pkl")
    
    return model_artifacts

# ============================================================================
# MODEL 2: PROJECT BUDGET MODEL
# ============================================================================

def train_project_budget_model():
    """
    Train Project Budget Model
    Predicts budget overruns and final status
    """
    print("\n" + "=" * 80)
    print("2️⃣  PROJECT BUDGET MODEL")
    print("=" * 80)
    
    # Load data
    df = load_data('project_budget_training_data.csv')
    if df is None or len(df) == 0:
        print("⚠️  No budget data available - creating synthetic dataset")
        
        # Create synthetic budget dataset from scratch
        categories = ['Towers', 'Conductors', 'Substations', 'Transformers', 'Labor', 'Transport', 'Equipment', 'Others']
        fiscal_years = ['2023-24', '2024-25', '2025-26']
        departments = ['Engineering', 'Procurement', 'Operations', 'Finance']
        statuses = ['on-track', 'under-budget', 'over-budget', 'critical']
        
        synthetic_data = []
        for i in range(150):
            allocated = np.random.uniform(1000000, 50000000)
            utilization = np.random.uniform(40, 150)
            spent = allocated * (utilization / 100)
            
            record = {
                'budget_id': f'BUD-{i+1:05d}',
                'category': np.random.choice(categories),
                'fiscal_year': np.random.choice(fiscal_years),
                'department': np.random.choice(departments),
                'allocated_amount': allocated,
                'spent_amount': spent,
                'projected_amount': allocated * np.random.uniform(0.9, 1.1),
                'remaining_amount': max(0, allocated - spent),
                'utilization_percent': utilization,
                'remaining_percent': max(0, 100 - utilization),
                'status': statuses[min(3, int(utilization / 30))],
                'total_transactions': np.random.randint(5, 50),
                'expense_count': np.random.randint(3, 30),
                'allocation_count': np.random.randint(1, 10),
                'transfer_count': np.random.randint(0, 5),
                'avg_transaction_amount': spent / max(1, np.random.randint(5, 50)),
                'is_on_track': 1 if 70 <= utilization <= 100 else 0,
                'is_under_budget': 1 if utilization < 70 else 0,
                'is_over_budget': 1 if 100 <= utilization < 150 else 0,
                'is_critical': 1 if utilization >= 150 else 0,
                'created_at': pd.Timestamp.now(),
                'updated_at': pd.Timestamp.now(),
                'days_active': np.random.randint(30, 365),
                'budget_exceeded': 1 if spent > allocated else 0,
                'overrun_amount': max(0, spent - allocated),
                'final_status': statuses[min(3, int(utilization / 30))]
            }
            synthetic_data.append(record)
        
        df = pd.DataFrame(synthetic_data)
        print(f"✅ Created {len(df)} synthetic budget records")
    
    print(f"\n📊 Dataset: {len(df)} budget records")
    print(f"📊 Features: {len(df.columns)} columns")
    
    # Feature engineering
    print("\n🔧 Feature Engineering...")
    
    categorical_features = ['category', 'fiscal_year', 'department', 'status']
    numerical_features = [
        'allocated_amount', 'spent_amount', 'projected_amount',
        'utilization_percent', 'total_transactions', 'expense_count',
        'allocation_count', 'transfer_count', 'avg_transaction_amount',
        'days_active'
    ]
    
    # Fill missing values
    for col in numerical_features:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())
    
    for col in categorical_features:
        if col in df.columns:
            df[col] = df[col].fillna('Unknown')
    
    # Encode categorical variables
    df_processed, encoders = preprocess_categorical(
        df.copy(),
        categorical_features
    )
    
    # ========================================================================
    # TASK 1: Predict Budget Overrun (Binary Classification)
    # ========================================================================
    print("\n" + "-" * 80)
    print("TASK 1: Budget Overrun Prediction (Classification)")
    print("-" * 80)
    
    feature_cols = [col for col in categorical_features + numerical_features if col in df_processed.columns]
    X = df_processed[feature_cols]
    y_overrun = df_processed['budget_exceeded']
    
    print(f"✅ Features: {len(feature_cols)}")
    print(f"✅ Target: budget_exceeded (0 = No, 1 = Yes)")
    print(f"📊 Class distribution: {dict(y_overrun.value_counts())}")
    
    # Check if we have enough data
    if len(X) < 10:
        print("\n⚠️  WARNING: Not enough budget data for reliable training")
        print("💡 Creating synthetic budget data...")
        
        # Create synthetic budget records
        categories = ['Towers', 'Conductors', 'Substations', 'Transformers', 'Labor', 'Transport', 'Equipment', 'Others']
        statuses = ['on-track', 'under-budget', 'over-budget', 'critical']
        
        synthetic_records = []
        for i in range(100):
            record = {}
            for col in feature_cols:
                if col in categorical_features:
                    if col == 'category':
                        record[col] = np.random.choice(range(len(categories)))
                    elif col == 'status':
                        record[col] = np.random.choice(range(len(statuses)))
                    else:
                        record[col] = np.random.randint(0, 5)
                else:
                    # Generate realistic numerical values
                    if 'amount' in col or 'projected' in col or 'allocated' in col:
                        record[col] = np.random.uniform(1000000, 50000000)
                    elif 'percent' in col or 'utilization' in col:
                        record[col] = np.random.uniform(0, 150)
                    elif 'count' in col or 'transactions' in col:
                        record[col] = np.random.randint(0, 100)
                    elif 'days' in col:
                        record[col] = np.random.randint(1, 365)
                    else:
                        record[col] = np.random.uniform(0, 10000)
            
            synthetic_records.append(record)
            
            # Generate target based on utilization
            utilization = record.get('utilization_percent', 50)
            y_overrun = pd.concat([y_overrun, pd.Series([1 if utilization > 100 else 0])], ignore_index=True)
        
        X = pd.concat([X, pd.DataFrame(synthetic_records)], ignore_index=True)
        print(f"✅ Added {len(synthetic_records)} synthetic budget records")
        print(f"📊 New dataset size: {len(X)} samples")
    
    # Split data
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_overrun, test_size=0.2, random_state=42, stratify=y_overrun
        )
    except ValueError:
        # If stratify fails due to class imbalance, split without stratification
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_overrun, test_size=0.2, random_state=42
        )
    
    # Scale features
    scaler_clf = StandardScaler()
    X_train_scaled = scaler_clf.fit_transform(X_train)
    X_test_scaled = scaler_clf.transform(X_test)
    
    # Train classification models
    print("\n🤖 Training Classification Models...")
    
    clf_models = {
        'Random Forest': RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1),
        'XGBoost': xgb.XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42),
        'LightGBM': lgb.LGBMClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42, verbose=-1),
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42)
    }
    
    clf_results = {}
    best_clf_model = None
    best_accuracy = 0
    
    for name, model in clf_models.items():
        print(f"\nTraining {name}...")
        model.fit(X_train_scaled, y_train)
        result = evaluate_classification_model(model, X_test_scaled, y_test, name)
        clf_results[name] = result
        
        if result['accuracy'] > best_accuracy:
            best_accuracy = result['accuracy']
            best_clf_model = (name, model)
    
    print(f"\n🏆 Best Classification Model: {best_clf_model[0]} (Accuracy = {best_accuracy:.4f})")
    
    # ========================================================================
    # TASK 2: Predict Overrun Amount (Regression)
    # ========================================================================
    print("\n" + "-" * 80)
    print("TASK 2: Overrun Amount Prediction (Regression)")
    print("-" * 80)
    
    # Only use samples where overrun occurred
    df_overrun = df_processed[df_processed['budget_exceeded'] == 1].copy()
    
    if len(df_overrun) > 10:
        X_reg = df_overrun[feature_cols]
        y_reg = df_overrun['overrun_amount']
        
        print(f"📊 Samples with overrun: {len(df_overrun)}")
        
        # Split data
        X_train_reg, X_test_reg, y_train_reg, y_test_reg = train_test_split(
            X_reg, y_reg, test_size=0.2, random_state=42
        )
        
        # Scale features
        scaler_reg = StandardScaler()
        X_train_reg_scaled = scaler_reg.fit_transform(X_train_reg)
        X_test_reg_scaled = scaler_reg.transform(X_test_reg)
        
        # Train regression model
        print("\n🤖 Training Regression Model...")
        overrun_model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
        overrun_model.fit(X_train_reg_scaled, y_train_reg)
        
        reg_result = evaluate_regression_model(overrun_model, X_test_reg_scaled, y_test_reg, "Overrun Amount Predictor")
    else:
        print("⚠️  Not enough overrun samples for regression model")
        overrun_model = None
        scaler_reg = None
        reg_result = None
    
    # Save models and artifacts
    budget_model_artifacts = {
        # Classification model (budget overrun prediction)
        'classification_model': best_clf_model[1],
        'classification_scaler': scaler_clf,
        'classification_performance': clf_results[best_clf_model[0]],
        
        # Regression model (overrun amount prediction)
        'regression_model': overrun_model,
        'regression_scaler': scaler_reg,
        'regression_performance': reg_result,
        
        # Common artifacts
        'encoders': encoders,
        'feature_cols': feature_cols,
        'categorical_features': categorical_features,
        'numerical_features': numerical_features,
        'training_date': datetime.now().isoformat(),
        'n_samples': len(df)
    }
    
    joblib.dump(budget_model_artifacts, 'models/budget_optimization/project_budget_model.pkl')
    print("\n✅ Saved: project_budget_model.pkl")
    
    return budget_model_artifacts

# ============================================================================
# MODEL 3: MATERIAL COST FORECASTING MODEL (BONUS)
# ============================================================================

def train_material_cost_model():
    """
    Train Material Cost Forecasting Model
    Predicts material price trends
    """
    print("\n" + "=" * 80)
    print("3️⃣  MATERIAL COST FORECASTING MODEL (BONUS)")
    print("=" * 80)
    
    # Load data
    df = load_data('material_cost_data.csv')
    if df is None:
        print("⚠️  material_cost_data.csv not found")
        df = pd.DataFrame()  # Create empty dataframe
    
    if len(df) == 0:
        print("⚠️  No material data - will create synthetic dataset")
    
    print(f"\n📊 Dataset: {len(df)} materials")
    
    # Feature engineering
    categorical_features = ['category', 'sub_category', 'status', 'location', 'supplier']
    numerical_features = [
        'current_quantity', 'threshold', 'reusable_quantity',
        'thickness', 'length', 'width', 'weight', 'days_since_update'
    ]
    
    # Fill missing values
    for col in numerical_features:
        if col in df.columns:
            df[col] = df[col].fillna(0)
    
    for col in categorical_features:
        if col in df.columns:
            df[col] = df[col].fillna('Unknown')
    
    # Remove rows with zero price
    df = df[df['unit_price'] > 0].copy()
    
    # Encode categorical variables
    df_processed, encoders = preprocess_categorical(
        df.copy(),
        categorical_features
    )
    
    if len(df) < 10:
        print("⚠️  Not enough data for material cost model")
        print("💡 Generating synthetic material data...")
        
        # Generate synthetic material data
        categories_list = ['Steel', 'Conductors', 'Insulators', 'Cement', 'Nuts/Bolts', 'Earthing', 'Others']
        status_list = ['optimal', 'low', 'critical', 'out-of-stock']
        
        synthetic_materials = []
        feature_cols_temp = categorical_features + numerical_features
        for i in range(50):
            record = {}
            for col in feature_cols_temp:
                if col in categorical_features:
                    if col == 'category':
                        record[col] = np.random.randint(0, len(categories_list))
                    elif col == 'status':
                        record[col] = np.random.randint(0, len(status_list))
                    else:
                        record[col] = np.random.randint(0, 10)
                else:
                    if 'quantity' in col or 'threshold' in col:
                        record[col] = np.random.randint(100, 10000)
                    elif col in ['thickness', 'length', 'width']:
                        record[col] = np.random.uniform(1, 100)
                    elif col == 'weight':
                        record[col] = np.random.uniform(10, 1000)
                    else:
                        record[col] = np.random.uniform(0, 100)
            
            synthetic_materials.append(record)
        
        df_synthetic = pd.DataFrame(synthetic_materials)
        df_processed = pd.concat([df_processed, df_synthetic], ignore_index=True)
        
        # Generate synthetic prices based on category
        category_prices = {0: 65, 1: 450, 2: 450, 3: 420, 4: 45, 5: 1200, 6: 100}
        synthetic_prices = [category_prices.get(r['category'], 100) * np.random.uniform(0.8, 1.2) 
                           for _, r in df_synthetic.iterrows()]
        
        df_processed['unit_price'] = pd.concat([
            df_processed['unit_price'][:len(df)],
            pd.Series(synthetic_prices)
        ], ignore_index=True)
        
        print(f"✅ Added {len(synthetic_materials)} synthetic materials")
        print(f"📊 New dataset size: {len(df_processed)} samples")
    
    # Use processed dataframe for features
    feature_cols_available = [col for col in categorical_features + numerical_features if col in df_processed.columns]
    X = df_processed[feature_cols_available]
    y = df_processed['unit_price']
    
    print(f"✅ Features: {len(feature_cols_available)}")
    print(f"✅ Target: unit_price")
    
    # Split and train
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train model
    print("\n🤖 Training Material Cost Model...")
    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
    model.fit(X_train_scaled, y_train)
    
    result = evaluate_regression_model(model, X_test_scaled, y_test, "Material Cost Predictor")
    
    # Save model
    material_model_artifacts = {
        'model': model,
        'scaler': scaler,
        'encoders': encoders,
        'feature_cols': feature_cols_available,
        'performance': result,
        'training_date': datetime.now().isoformat()
    }
    
    joblib.dump(material_model_artifacts, 'models/budget_optimization/material_cost_model.pkl')
    print("\n✅ Saved: material_cost_model.pkl")
    
    return material_model_artifacts

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    print(f"\n🕐 Training started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Train all models
    cost_model = train_cost_forecasting_model()
    budget_model = train_project_budget_model()
    material_model = train_material_cost_model()
    
    # Summary
    print("\n" + "=" * 80)
    print("✅ TRAINING COMPLETE!")
    print("=" * 80)
    
    print("\n📦 Models Created:")
    if cost_model:
        print("   ✅ cost_forecasting_model.pkl - Predicts total project costs")
    if budget_model:
        print("   ✅ project_budget_model.pkl - Predicts budget overruns")
    if material_model:
        print("   ✅ material_cost_model.pkl - Predicts material prices")
    
    print("\n💡 Usage:")
    print("   import joblib")
    print("   model = joblib.load('models/budget_optimization/cost_forecasting_model.pkl')")
    print("   predictions = model['model'].predict(model['scaler'].transform(X))")
    
    print(f"\n🕐 Training completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

if __name__ == "__main__":
    main()
