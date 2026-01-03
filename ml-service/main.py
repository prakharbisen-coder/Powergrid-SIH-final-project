from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
import os
import json
from forecasting_service import ensemble_service, ForecastInput, ForecastOutput
from advanced_forecasting_service import advanced_service, AdvancedForecastInput, AdvancedForecastOutput
from scenario.simulate import router as scenario_router
from SIMULATION import router as simulation_router

app = FastAPI(
    title="Power Grid ML Service",
    description="Machine Learning API for material demand forecasting",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://localhost:8080", "http://localhost:5000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(scenario_router, prefix="/api/scenario", tags=["Scenario Simulation (Legacy)"])
app.include_router(simulation_router, prefix="/simulation", tags=["Scenario Simulation (New)"])

# Model path
MODEL_PATH = "models/material_demand_model.pkl"
MODEL_INFO_PATH = "models/model_info.json"

# Pydantic models for request/response
class PredictionInput(BaseModel):
    project_name: str
    tower_count: int
    voltage: str
    tower_type: str
    terrain: str
    region: str
    project_duration_months: Optional[int] = 12

class PredictionOutput(BaseModel):
    project_name: str
    predictions: Dict[str, float]
    confidence_scores: Dict[str, float]
    total_estimated_cost: float
    timestamp: str

class TrainingData(BaseModel):
    features: List[List[float]]
    labels: List[float]

class ModelInfo(BaseModel):
    model_type: str
    version: str
    trained_date: str
    accuracy: float
    features: List[str]

# Load model if exists
def load_model():
    """Load the trained model from disk"""
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
    return None

def load_model_info():
    """Load model information"""
    if os.path.exists(MODEL_INFO_PATH):
        with open(MODEL_INFO_PATH, 'r') as f:
            return json.load(f)
    return None

# Initialize model
model = load_model()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Power Grid ML Service",
        "version": "1.0.0",
        "model_loaded": model is not None
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "model_status": "loaded" if model is not None else "not_loaded",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/model-info", response_model=ModelInfo)
async def get_model_info():
    """Get information about the loaded model"""
    info = load_model_info()
    if not info:
        raise HTTPException(status_code=404, detail="Model information not found")
    return info

@app.post("/predict", response_model=PredictionOutput)
async def predict(input_data: PredictionInput):
    """
    Make predictions for material demand based on project parameters
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Please train or upload a model first.")
    
    try:
        # Feature engineering
        features = encode_features(input_data)
        
        # Make prediction (this is a simplified version)
        # In a real scenario, you'd use the actual trained model
        predictions = calculate_material_requirements(input_data)
        
        # Calculate confidence scores (mock values for demonstration)
        confidence_scores = {
            material: 0.85 + (np.random.random() * 0.15) 
            for material in predictions.keys()
        }
        
        # Calculate total cost
        material_costs = {
            'Steel': 65,
            'Conductors': 450,
            'Insulators': 450,
            'Cement': 420,
            'Nuts/Bolts': 45,
            'Earthing': 1200
        }
        
        total_cost = sum(
            predictions[material] * material_costs.get(material, 100)
            for material in predictions.keys()
        )
        
        return PredictionOutput(
            project_name=input_data.project_name,
            predictions=predictions,
            confidence_scores=confidence_scores,
            total_estimated_cost=total_cost,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

def encode_features(input_data: PredictionInput) -> np.ndarray:
    """
    Encode input features for the model
    """
    # Voltage encoding
    voltage_map = {'66kV': 0, '132kV': 1, '220kV': 2, '400kV': 3, '765kV': 4}
    voltage_encoded = voltage_map.get(input_data.voltage, 2)
    
    # Tower type encoding
    tower_type_map = {
        '66kV Lattice': 0, '132kV Lattice': 1, '220kV Lattice': 2,
        '400kV Lattice': 3, '765kV Lattice': 4, 'Monopole': 5, 'Tubular': 6
    }
    tower_type_encoded = tower_type_map.get(input_data.tower_type, 2)
    
    # Terrain encoding
    terrain_map = {'Plain': 0, 'Hilly': 1, 'Coastal': 2, 'Desert': 3, 'Forest': 4}
    terrain_encoded = terrain_map.get(input_data.terrain, 0)
    
    # Region encoding
    region_map = {'North': 0, 'South': 1, 'East': 2, 'West': 3, 'Central': 4, 'North-East': 5}
    region_encoded = region_map.get(input_data.region, 4)
    
    # Create feature array
    features = np.array([
        input_data.tower_count,
        voltage_encoded,
        tower_type_encoded,
        terrain_encoded,
        region_encoded,
        input_data.project_duration_months
    ])
    
    return features

def calculate_material_requirements(input_data: PredictionInput) -> Dict[str, float]:
    """
    Calculate material requirements based on project specifications
    This is a rule-based approach that can be replaced with ML model predictions
    """
    tower_count = input_data.tower_count
    voltage = input_data.voltage
    terrain = input_data.terrain
    
    # Base material factors per tower
    base_factors = {
        'Steel': 5000,  # kg per tower
        'Conductors': 3000,  # meters per tower span
        'Insulators': 15,  # pieces per tower
        'Cement': 50,  # bags per tower foundation
        'Nuts/Bolts': 200,  # pieces per tower
        'Earthing': 10  # sets per tower
    }
    
    # Voltage multipliers
    voltage_multipliers = {
        '66kV': 0.6,
        '132kV': 0.8,
        '220kV': 1.0,
        '400kV': 1.4,
        '765kV': 1.8
    }
    
    # Terrain multipliers
    terrain_multipliers = {
        'Plain': 1.0,
        'Hilly': 1.3,
        'Coastal': 1.15,
        'Desert': 1.2,
        'Forest': 1.25
    }
    
    voltage_mult = voltage_multipliers.get(voltage, 1.0)
    terrain_mult = terrain_multipliers.get(terrain, 1.0)
    
    # Calculate requirements
    predictions = {}
    for material, base_qty in base_factors.items():
        total_qty = base_qty * tower_count * voltage_mult * terrain_mult
        # Add some variance (±10%)
        variance = np.random.uniform(0.9, 1.1)
        predictions[material] = round(total_qty * variance, 2)
    
    return predictions

@app.post("/train")
async def train_model(training_data: TrainingData):
    """
    Train or retrain the model with new data
    """
    try:
        from sklearn.ensemble import RandomForestRegressor
        from sklearn.model_selection import train_test_split
        
        # Convert to numpy arrays
        X = np.array(training_data.features)
        y = np.array(training_data.labels)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Train model
        new_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        new_model.fit(X_train, y_train)
        
        # Evaluate
        score = new_model.score(X_test, y_test)
        
        # Save model
        os.makedirs("models", exist_ok=True)
        joblib.dump(new_model, MODEL_PATH)
        
        # Save model info
        model_info = {
            "model_type": "RandomForestRegressor",
            "version": "1.0",
            "trained_date": datetime.now().isoformat(),
            "accuracy": float(score),
            "features": ["tower_count", "voltage", "tower_type", "terrain", "region", "duration"]
        }
        
        with open(MODEL_INFO_PATH, 'w') as f:
            json.dump(model_info, f, indent=2)
        
        # Reload the model
        global model
        model = new_model
        
        return {
            "status": "success",
            "message": "Model trained successfully",
            "accuracy": float(score),
            "samples_trained": len(X_train)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")

@app.post("/upload-model")
async def upload_model(file: UploadFile = File(...)):
    """
    Upload a pre-trained .pkl model file
    """
    if not file.filename.endswith('.pkl'):
        raise HTTPException(status_code=400, detail="File must be a .pkl file")
    
    try:
        # Save uploaded file
        os.makedirs("models", exist_ok=True)
        file_path = f"models/{file.filename}"
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Try to load the model
        uploaded_model = joblib.load(file_path)
        
        # If successful, update the main model
        global model
        model = uploaded_model
        
        # Copy to main model path
        if file_path != MODEL_PATH:
            joblib.dump(model, MODEL_PATH)
        
        return {
            "status": "success",
            "message": f"Model {file.filename} uploaded and loaded successfully",
            "model_loaded": True
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")

@app.post("/batch-predict")
async def batch_predict(inputs: List[PredictionInput]):
    """
    Make predictions for multiple projects at once
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        results = []
        for input_data in inputs:
            predictions = calculate_material_requirements(input_data)
            confidence_scores = {
                material: 0.85 + (np.random.random() * 0.15) 
                for material in predictions.keys()
            }
            
            material_costs = {
                'Steel': 65, 'Conductors': 450, 'Insulators': 450,
                'Cement': 420, 'Nuts/Bolts': 45, 'Earthing': 1200
            }
            
            total_cost = sum(
                predictions[material] * material_costs.get(material, 100)
                for material in predictions.keys()
            )
            
            results.append({
                "project_name": input_data.project_name,
                "predictions": predictions,
                "confidence_scores": confidence_scores,
                "total_estimated_cost": total_cost
            })
        
        return {
            "status": "success",
            "count": len(results),
            "predictions": results,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction error: {str(e)}")

@app.post("/forecast", response_model=ForecastOutput)
async def generate_forecast(input_data: ForecastInput):
    """
    Generate comprehensive material demand forecast using ensemble stack model
    """
    try:
        forecast = await ensemble_service.generate_forecast(input_data)
        return forecast
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")

@app.post("/forecast/batch")
async def generate_batch_forecasts(inputs: List[ForecastInput]):
    """
    Generate forecasts for multiple projects
    """
    try:
        forecasts = []
        for input_data in inputs:
            forecast = await ensemble_service.generate_forecast(input_data)
            forecasts.append(forecast.dict())
        
        return {
            "status": "success",
            "count": len(forecasts),
            "forecasts": forecasts,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch forecasting error: {str(e)}")

@app.get("/forecast/model-status")
async def get_forecast_model_status():
    """
    Check if encoders, features, and ensemble stack model are loaded and operational
    """
    status = ensemble_service.get_model_status()
    return {
        "encoders_loaded": status["encoders_loaded"],
        "encoders_count": status["encoders_count"],
        "ensemble_model_loaded": status["model_loaded"],
        "features_loaded": status.get("features_loaded", False),
        "encoders_path": "encoders (4) new.pkl",
        "model_path": "ensemble_stack_model.pkl",
        "features_path": "features.pkl",
        "service_status": status["status"],
        "status": "ready" if status["status"] == "ready" else "not_ready",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/forecast/advanced", response_model=AdvancedForecastOutput)
async def generate_advanced_forecast(input_data: AdvancedForecastInput):
    """
    Generate advanced material demand forecast with BOQ validation
    Includes lag features, rolling features, trend analysis, and stacking ensemble
    """
    try:
        forecast = await advanced_service.generate_advanced_forecast(input_data)
        return forecast
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Advanced forecasting error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
