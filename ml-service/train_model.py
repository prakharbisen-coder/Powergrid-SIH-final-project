"""
Script to train and save a material demand forecasting model
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
import json
from datetime import datetime
import os

# Create models directory
os.makedirs("models", exist_ok=True)

# Generate synthetic training data
def generate_training_data(n_samples=1000):
    """
    Generate synthetic training data for material demand prediction
    """
    np.random.seed(42)
    
    data = []
    
    for _ in range(n_samples):
        # Features
        tower_count = np.random.randint(20, 200)
        voltage = np.random.choice([0, 1, 2, 3, 4])  # 66kV to 765kV
        tower_type = np.random.choice([0, 1, 2, 3, 4, 5, 6])
        terrain = np.random.choice([0, 1, 2, 3, 4])
        region = np.random.choice([0, 1, 2, 3, 4, 5])
        duration = np.random.randint(6, 36)
        
        # Base material calculation (simplified)
        voltage_mult = [0.6, 0.8, 1.0, 1.4, 1.8][voltage]
        terrain_mult = [1.0, 1.3, 1.15, 1.2, 1.25][terrain]
        
        # Material requirements for different categories
        steel = 5000 * tower_count * voltage_mult * terrain_mult
        conductors = 3000 * tower_count * voltage_mult * terrain_mult
        insulators = 15 * tower_count * voltage_mult * terrain_mult
        cement = 50 * tower_count * terrain_mult
        nuts_bolts = 200 * tower_count * voltage_mult
        earthing = 10 * tower_count * terrain_mult
        
        data.append({
            'tower_count': tower_count,
            'voltage': voltage,
            'tower_type': tower_type,
            'terrain': terrain,
            'region': region,
            'duration': duration,
            'steel': steel,
            'conductors': conductors,
            'insulators': insulators,
            'cement': cement,
            'nuts_bolts': nuts_bolts,
            'earthing': earthing
        })
    
    return pd.DataFrame(data)

# Generate data
print("Generating training data...")
df = generate_training_data(1000)

# Features and targets
feature_cols = ['tower_count', 'voltage', 'tower_type', 'terrain', 'region', 'duration']
target_cols = ['steel', 'conductors', 'insulators', 'cement', 'nuts_bolts', 'earthing']

X = df[feature_cols].values
y = df[target_cols].values

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"Training samples: {len(X_train)}")
print(f"Test samples: {len(X_test)}")

# Train models for each material type
models = {}
scores = {}

for idx, material in enumerate(target_cols):
    print(f"\nTraining model for {material}...")
    
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train[:, idx])
    score = model.score(X_test, y_test[:, idx])
    
    models[material] = model
    scores[material] = score
    
    print(f"  R² Score: {score:.4f}")

# Save individual models
for material, model in models.items():
    model_path = f"models/{material}_model.pkl"
    joblib.dump(model, model_path)
    print(f"Saved: {model_path}")

# Save combined model
combined_model = {
    'models': models,
    'feature_names': feature_cols,
    'target_names': target_cols,
    'scaler': None  # Can add StandardScaler if needed
}

joblib.dump(combined_model, "models/material_demand_model.pkl")
print("\nSaved: models/material_demand_model.pkl")

# Save model info
model_info = {
    "model_type": "RandomForestRegressor (Multi-target)",
    "version": "1.0",
    "trained_date": datetime.now().isoformat(),
    "accuracy": {material: float(score) for material, score in scores.items()},
    "average_accuracy": float(np.mean(list(scores.values()))),
    "features": feature_cols,
    "targets": target_cols,
    "training_samples": len(X_train),
    "test_samples": len(X_test)
}

with open("models/model_info.json", 'w') as f:
    json.dump(model_info, f, indent=2)

print("\nSaved: models/model_info.json")
print("\n" + "="*50)
print("MODEL TRAINING SUMMARY")
print("="*50)
print(f"Average R² Score: {model_info['average_accuracy']:.4f}")
print(f"Training Samples: {len(X_train)}")
print(f"Test Samples: {len(X_test)}")
print("\nPer-Material Scores:")
for material, score in scores.items():
    print(f"  {material}: {score:.4f}")
print("="*50)
print("\n✅ Model training complete!")
