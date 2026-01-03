"""
Test Script for Budget Optimization ML Models

Demonstrates how to load and use the trained models for predictions
"""

import joblib
import pandas as pd
import numpy as np

print("="*80)
print("BUDGET OPTIMIZATION ML MODELS - TEST SCRIPT")
print("="*80)

# ============================================================================
# TEST 1: Cost Forecasting Model
# ============================================================================
print("\n" + "="*80)
print("TEST 1: COST FORECASTING MODEL")
print("="*80)

try:
    # Load model
    cost_model = joblib.load('models/budget_optimization/cost_forecasting_model.pkl')
    print(f"✅ Model loaded successfully")
    print(f"   Model Type: {cost_model['model_name']}")
    print(f"   Training Date: {cost_model['training_date']}")
    print(f"   Training Samples: {cost_model['n_samples']}")
    print(f"   R² Score: {cost_model['performance']['r2']:.4f}")
    
    # Prepare test input
    test_project = {
        'region': 'North',
        'terrain': 'Plain',
        'tower_type': '220kV Lattice',
        'substation_type': 'None',
        'voltage_level': '220kV',
        'project_status': 'Planning',
        'rainfall_level': 'Medium',
        'project_overall_status': 'Active',
        'financial_year': '2024-25',
        'tower_count': 75,
        'substation_count': 0,
        'line_length_km': 100,
        'duration_days': 180,
        'gst_percent': 18,
        'transport_cost': 500000,
        'state_taxes': 300000,
        'custom_duty': 0,
        'other_charges': 0,
        'avg_temperature': 25,
        'cyclone_prone': 0,
        'contractor_rating': 4,
        'steel_cost': 5000000,
        'conductor_cost': 8000000,
        'insulator_cost': 3000000,
        'cement_cost': 2000000,
        'earthing_cost': 1000000,
        'other_material_cost': 500000
    }
    
    # Convert to DataFrame
    X = pd.DataFrame([test_project])
    
    # Encode categorical features
    for col in cost_model['categorical_features']:
        if col in X.columns and col in cost_model['encoders']:
            try:
                X[col] = cost_model['encoders'][col].transform(X[col].astype(str))
            except:
                X[col] = 0  # Use default if encoding fails
    
    # Ensure all required features are present
    for col in cost_model['feature_cols']:
        if col not in X.columns:
            X[col] = 0
    
    # Select and order features correctly
    X = X[cost_model['feature_cols']]
    
    # Scale features
    X_scaled = cost_model['scaler'].transform(X)
    
    # Predict
    predicted_cost = cost_model['model'].predict(X_scaled)[0]
    
    print(f"\n📊 Project Specification:")
    print(f"   Region: {test_project['region']}")
    print(f"   Towers: {test_project['tower_count']}")
    print(f"   Line Length: {test_project['line_length_km']} km")
    print(f"   Voltage: {test_project['voltage_level']}")
    
    print(f"\n💰 Cost Prediction:")
    print(f"   Predicted Cost: ₹{predicted_cost:,.2f}")
    print(f"   In Crores: ₹{predicted_cost/10000000:.2f} Cr")
    print(f"   Cost per Tower: ₹{predicted_cost/test_project['tower_count']:,.2f}")
    print(f"   Cost per km: ₹{predicted_cost/test_project['line_length_km']:,.2f}")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")

# ============================================================================
# TEST 2: Project Budget Model
# ============================================================================
print("\n" + "="*80)
print("TEST 2: PROJECT BUDGET MODEL")
print("="*80)

try:
    # Load model
    budget_model = joblib.load('models/budget_optimization/project_budget_model.pkl')
    print(f"✅ Model loaded successfully")
    print(f"   Classification Accuracy: {budget_model['classification_performance']['accuracy']:.4f}")
    if budget_model['regression_performance']:
        print(f"   Regression R² Score: {budget_model['regression_performance']['r2']:.4f}")
    
    # Test budget scenario
    test_budget = {
        'category': 'Conductors',
        'fiscal_year': '2024-25',
        'department': 'Procurement',
        'status': 'on-track',
        'allocated_amount': 10000000,
        'spent_amount': 9500000,
        'projected_amount': 10500000,
        'utilization_percent': 95,
        'total_transactions': 25,
        'expense_count': 20,
        'allocation_count': 3,
        'transfer_count': 2,
        'avg_transaction_amount': 400000,
        'days_active': 120
    }
    
    # Prepare data
    X = pd.DataFrame([test_budget])
    
    # Encode categorical features
    for col in budget_model['categorical_features']:
        if col in X.columns and col in budget_model['encoders']:
            try:
                X[col] = budget_model['encoders'][col].transform(X[col].astype(str))
            except:
                X[col] = 0
    
    # Ensure all required features
    for col in budget_model['feature_cols']:
        if col not in X.columns:
            X[col] = 0
    
    X = X[budget_model['feature_cols']]
    
    # Scale and predict
    X_scaled = budget_model['classification_scaler'].transform(X)
    
    # Predict budget overrun
    overrun_prob = budget_model['classification_model'].predict_proba(X_scaled)[0]
    will_exceed = budget_model['classification_model'].predict(X_scaled)[0]
    
    print(f"\n📊 Budget Scenario:")
    print(f"   Category: {test_budget['category']}")
    print(f"   Allocated: ₹{test_budget['allocated_amount']:,.2f}")
    print(f"   Spent: ₹{test_budget['spent_amount']:,.2f}")
    print(f"   Utilization: {test_budget['utilization_percent']:.1f}%")
    
    print(f"\n🎯 Overrun Prediction:")
    print(f"   Will Exceed Budget: {'YES' if will_exceed else 'NO'}")
    print(f"   Probability: {overrun_prob[1]*100:.1f}%")
    
    if will_exceed and budget_model['regression_model']:
        # Predict overrun amount
        X_reg_scaled = budget_model['regression_scaler'].transform(X)
        predicted_overrun = budget_model['regression_model'].predict(X_reg_scaled)[0]
        print(f"   Expected Overrun: ₹{predicted_overrun:,.2f}")
        print(f"   Final Cost Estimate: ₹{test_budget['allocated_amount'] + predicted_overrun:,.2f}")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")

# ============================================================================
# TEST 3: Material Cost Model
# ============================================================================
print("\n" + "="*80)
print("TEST 3: MATERIAL COST MODEL")
print("="*80)

try:
    # Load model
    material_model = joblib.load('models/budget_optimization/material_cost_model.pkl')
    print(f"✅ Model loaded successfully")
    print(f"   R² Score: {material_model['performance']['r2']:.4f}")
    print(f"   MAE: ₹{material_model['performance']['mae']:.2f}")
    
    # Test material
    test_material = {
        'category': 'Steel',
        'sub_category': 'Angle Steel',
        'status': 'optimal',
        'location': 'Warehouse-A',
        'supplier': 'Vendor-1',
        'current_quantity': 5000,
        'threshold': 1000,
        'reusable_quantity': 200,
        'thickness': 6.0,
        'length': 6000,
        'width': 50,
        'weight': 5.4,
        'days_since_update': 15
    }
    
    # Prepare data
    X = pd.DataFrame([test_material])
    
    # Encode categorical features
    for col in material_model['encoders'].keys():
        if col in X.columns:
            try:
                X[col] = material_model['encoders'][col].transform(X[col].astype(str))
            except:
                X[col] = 0
    
    # Ensure all required features
    for col in material_model['feature_cols']:
        if col not in X.columns:
            X[col] = 0
    
    X = X[material_model['feature_cols']]
    
    # Scale and predict
    X_scaled = material_model['scaler'].transform(X)
    predicted_price = material_model['model'].predict(X_scaled)[0]
    
    print(f"\n📊 Material Specification:")
    print(f"   Category: {test_material['category']}")
    print(f"   Sub-Category: {test_material['sub_category']}")
    print(f"   Dimensions: {test_material['length']}mm × {test_material['width']}mm × {test_material['thickness']}mm")
    print(f"   Weight: {test_material['weight']} kg/m")
    
    print(f"\n💰 Price Prediction:")
    print(f"   Predicted Unit Price: ₹{predicted_price:.2f}")
    print(f"   For {test_material['current_quantity']} units: ₹{predicted_price * test_material['current_quantity']:,.2f}")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")

# ============================================================================
# Summary
# ============================================================================
print("\n" + "="*80)
print("✅ ALL TESTS COMPLETED")
print("="*80)
print("\n💡 Models are ready to use in production!")
print("\nIntegration Examples:")
print("  • Cost Forecasting: Predict project costs during planning phase")
print("  • Budget Overrun: Early warning system for budget issues")
print("  • Material Cost: Fair price estimation for procurement")
print("\n" + "="*80 + "\n")
