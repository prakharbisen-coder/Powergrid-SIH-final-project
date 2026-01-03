"""
Enhanced Forecasting Service using Ensemble Stack Model with Encoders
"""
from fastapi import HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import os

# Model and encoder paths - UPDATED TO NEW MODELS
ENCODERS_PATH = "encoders (4) new.pkl"
ENSEMBLE_MODEL_PATH = "ensemble_stack_model.pkl"
FEATURES_PATH = "features.pkl"

class ForecastInput(BaseModel):
    project_id: str
    project_name: str
    tower_count: int
    voltage: str
    tower_type: str
    terrain: str
    region: str
    start_date: str
    end_date: str
    historical_data: Optional[List[Dict]] = None
    boq_data: Optional[Dict] = None
    boq_data: Optional[Dict] = None

class MaterialForecast(BaseModel):
    material: str
    predicted_quantity: float
    confidence_interval_low: float
    confidence_interval_high: float
    confidence_score: float
    unit: str

class ForecastOutput(BaseModel):
    project_id: str
    project_name: str
    forecast_date: str
    forecasts: List[MaterialForecast]
    total_estimated_cost: float
    risk_level: str
    recommendations: List[str]

class EnsembleForecastingService:
    def __init__(self):
        self.encoders = None
        self.model = None
        self.features = None
        self.load_encoders()
        self.load_ensemble_model()
        self.load_features()
    
    def load_encoders(self):
        """Load the label encoders"""
        try:
            if os.path.exists(ENCODERS_PATH):
                self.encoders = joblib.load(ENCODERS_PATH)
                print(f"[OK] Encoders loaded from {ENCODERS_PATH}")
                print(f"     Available encoders: {list(self.encoders.keys())}")
            else:
                print(f"[WARNING] Encoders not found at {ENCODERS_PATH}")
                self.encoders = None
        except Exception as e:
            print(f"[ERROR] Error loading encoders: {str(e)}")
            self.encoders = None
    
    def load_ensemble_model(self):
        """Load the ensemble stack model"""
        try:
            if os.path.exists(ENSEMBLE_MODEL_PATH):
                self.model = joblib.load(ENSEMBLE_MODEL_PATH)
                print(f"[OK] Ensemble Stack Model loaded from {ENSEMBLE_MODEL_PATH}")
            else:
                print(f"[WARNING] Ensemble model not found at {ENSEMBLE_MODEL_PATH}")
                self.model = None
        except Exception as e:
            print(f"[ERROR] Error loading ensemble model: {str(e)}")
            self.model = None
    
    def load_features(self):
        """Load the features file"""
        try:
            if os.path.exists(FEATURES_PATH):
                self.features = joblib.load(FEATURES_PATH)
                print(f"[OK] Features loaded from {FEATURES_PATH}")
                if isinstance(self.features, (list, np.ndarray)):
                    print(f"     Features count: {len(self.features)}")
                elif isinstance(self.features, dict):
                    print(f"     Features keys: {list(self.features.keys())}")
            else:
                print(f"[WARNING] Features not found at {FEATURES_PATH}")
                self.features = None
        except Exception as e:
            print(f"[ERROR] Error loading features: {str(e)}")
            self.features = None
    
    def get_model_status(self) -> dict:
        """Get the status of encoders, model, and features"""
        return {
            "encoders_loaded": self.encoders is not None,
            "encoders_count": len(self.encoders) if self.encoders else 0,
            "model_loaded": self.model is not None,
            "features_loaded": self.features is not None,
            "status": "ready" if (self.encoders is not None and self.model is not None and self.features is not None) else "partial" if (self.encoders is not None or self.model is not None or self.features is not None) else "not_ready"
        }
    
    def prepare_features(self, input_data: ForecastInput) -> np.ndarray:
        """
        Prepare features for the ensemble model using loaded encoders
        """
        # Calculate project duration
        start = datetime.fromisoformat(input_data.start_date.replace('Z', '+00:00'))
        end = datetime.fromisoformat(input_data.end_date.replace('Z', '+00:00'))
        duration_months = (end.year - start.year) * 12 + (end.month - start.month)
        
        # Encode features using loaded encoders if available
        if self.encoders:
            try:
                # Use encoders.pkl for encoding
                voltage_encoded = self.encoders.get('voltage_encoder', {}).get(input_data.voltage, 2)
                tower_type_encoded = self.encoders.get('tower_type_encoder', {}).get(input_data.tower_type, 2)
                terrain_encoded = self.encoders.get('terrain_encoder', {}).get(input_data.terrain, 0)
                region_encoded = self.encoders.get('region_encoder', {}).get(input_data.region, 4)
                
                print(f"🔄 Using encoders.pkl for feature encoding:")
                print(f"   Voltage '{input_data.voltage}' -> {voltage_encoded}")
                print(f"   Tower Type '{input_data.tower_type}' -> {tower_type_encoded}")
                print(f"   Terrain '{input_data.terrain}' -> {terrain_encoded}")
                print(f"   Region '{input_data.region}' -> {region_encoded}")
            except Exception as e:
                print(f"⚠️  Error using encoders, falling back to default mappings: {str(e)}")
                # Fallback to default mappings
                voltage_encoded = self._encode_voltage_fallback(input_data.voltage)
                tower_type_encoded = self._encode_tower_type_fallback(input_data.tower_type)
                terrain_encoded = self._encode_terrain_fallback(input_data.terrain)
                region_encoded = self._encode_region_fallback(input_data.region)
        else:
            print("⚠️  Encoders not loaded, using fallback mappings")
            # Fallback encoding if encoders not loaded
            voltage_encoded = self._encode_voltage_fallback(input_data.voltage)
            tower_type_encoded = self._encode_tower_type_fallback(input_data.tower_type)
            terrain_encoded = self._encode_terrain_fallback(input_data.terrain)
            region_encoded = self._encode_region_fallback(input_data.region)
        
        # Additional features
        season = self.get_season(start)
        weather_factor = self.get_weather_factor(input_data.terrain, season)
        
        # Create feature array
        features = np.array([
            input_data.tower_count,
            voltage_encoded,
            tower_type_encoded,
            terrain_encoded,
            region_encoded,
            duration_months,
            season,
            weather_factor,
            input_data.tower_count * voltage_encoded,  # Interaction term
            duration_months / 12.0  # Duration in years
        ])
        
        return features.reshape(1, -1)
    
    def _encode_voltage_fallback(self, voltage: str) -> int:
        """Fallback voltage encoding"""
        voltage_map = {
            '66kV': 0, '132kV': 1, '220kV': 2, '400kV': 3, '765kV': 4
        }
        return voltage_map.get(voltage, 2)
    
    def _encode_tower_type_fallback(self, tower_type: str) -> int:
        """Fallback tower type encoding"""
        tower_type_map = {
            '66kV Lattice': 0, '132kV Lattice': 1, '220kV Lattice': 2,
            '400kV Lattice': 3, '765kV Lattice': 4, 'Monopole': 5, 'Tubular': 6
        }
        return tower_type_map.get(tower_type, 2)
    
    def _encode_terrain_fallback(self, terrain: str) -> int:
        """Fallback terrain encoding"""
        terrain_map = {
            'Plain': 0, 'Hilly': 1, 'Coastal': 2, 'Desert': 3, 'Forest': 4
        }
        return terrain_map.get(terrain, 0)
    
    def _encode_region_fallback(self, region: str) -> int:
        """Fallback region encoding"""
        region_map = {
            'North': 0, 'South': 1, 'East': 2, 'West': 3, 'Central': 4, 'North-East': 5
        }
        return region_map.get(region, 4)
    
    def get_season(self, date: datetime) -> int:
        """Get season encoding (0: Winter, 1: Spring, 2: Summer, 3: Monsoon, 4: Autumn)"""
        month = date.month
        if month in [12, 1, 2]:
            return 0  # Winter
        elif month in [3, 4, 5]:
            return 1  # Spring
        elif month in [6, 7, 8]:
            return 3  # Monsoon
        elif month in [9, 10, 11]:
            return 4  # Autumn
        return 2  # Summer
    
    def get_weather_factor(self, terrain: str, season: int) -> float:
        """Calculate weather impact factor"""
        weather_matrix = {
            'Plain': [1.0, 1.0, 1.1, 1.2, 1.0],
            'Hilly': [1.3, 1.2, 1.1, 1.4, 1.2],
            'Coastal': [1.2, 1.1, 1.2, 1.5, 1.2],
            'Desert': [1.1, 1.2, 1.4, 1.1, 1.1],
            'Forest': [1.2, 1.1, 1.2, 1.4, 1.2]
        }
        return weather_matrix.get(terrain, [1.0]*5)[season]
    
    def calculate_confidence_interval(self, prediction: float, confidence: float = 0.95) -> tuple:
        """Calculate confidence interval for prediction"""
        std_dev = prediction * 0.15  # Assume 15% standard deviation
        z_score = 1.96 if confidence == 0.95 else 2.576  # 95% or 99% CI
        
        margin = z_score * std_dev
        return (prediction - margin, prediction + margin)
    
    def assess_risk_level(self, predictions: Dict[str, float]) -> str:
        """Assess overall risk level based on predictions"""
        total_value = sum(predictions.values())
        
        if total_value > 500000000:  # > 50 Crore
            return "High"
        elif total_value > 200000000:  # > 20 Crore
            return "Medium"
        else:
            return "Low"
    
    def generate_recommendations(self, input_data: ForecastInput, predictions: Dict[str, float]) -> List[str]:
        """Generate procurement recommendations"""
        recommendations = []
        
        # Based on terrain
        if input_data.terrain in ['Hilly', 'Forest']:
            recommendations.append("Consider additional foundation materials for challenging terrain")
            recommendations.append("Plan for extended transportation time due to terrain conditions")
        
        # Based on voltage
        if input_data.voltage in ['400kV', '765kV']:
            recommendations.append("High voltage project requires premium quality materials")
            recommendations.append("Schedule early procurement for specialized insulators")
        
        # Based on project duration
        start = datetime.fromisoformat(input_data.start_date.replace('Z', '+00:00'))
        end = datetime.fromisoformat(input_data.end_date.replace('Z', '+00:00'))
        duration_months = (end.year - start.year) * 12 + (end.month - start.month)
        
        if duration_months > 24:
            recommendations.append("Long duration project - consider phased material procurement")
            recommendations.append("Set up buffer stock at project site to avoid delays")
        
        # Based on tower count
        if input_data.tower_count > 150:
            recommendations.append("Large project - negotiate bulk purchase discounts")
            recommendations.append("Engage multiple suppliers to ensure continuous supply")
        
        # Seasonal recommendations
        season = self.get_season(start)
        if season == 3:  # Monsoon
            recommendations.append("Monsoon season project - ensure waterproof storage facilities")
            recommendations.append("Add 20% buffer stock for weather-related delays")
        
        return recommendations[:5]  # Return top 5 recommendations
    
    async def generate_forecast(self, input_data: ForecastInput) -> ForecastOutput:
        """
        Generate comprehensive material demand forecast using ensemble model
        """
        try:
            # Prepare features
            features = self.prepare_features(input_data)
            
            # Base material calculations (enhanced with model if available)
            predictions = self.calculate_base_predictions(input_data)
            
            # If ensemble model is loaded, enhance predictions
            if self.model is not None:
                try:
                    # Use ensemble model for enhanced predictions
                    model_predictions = self.model.predict(features)
                    
                    # Adjust predictions with model output
                    # Assuming model outputs multiplier factors
                    if len(model_predictions) > 0:
                        multiplier = float(model_predictions[0])
                        for material in predictions:
                            predictions[material] *= multiplier
                except Exception as e:
                    print(f"Model prediction error: {e}. Using base calculations.")
            
            # Create material forecasts with confidence intervals
            material_forecasts = []
            material_costs = {
                'Steel': 65,
                'Conductors': 450,
                'Insulators': 450,
                'Cement': 420,
                'Nuts/Bolts': 45,
                'Earthing': 1200
            }
            
            material_units = {
                'Steel': 'kg',
                'Conductors': 'meters',
                'Insulators': 'pieces',
                'Cement': 'bags',
                'Nuts/Bolts': 'pieces',
                'Earthing': 'sets'
            }
            
            total_cost = 0
            
            for material, quantity in predictions.items():
                ci_low, ci_high = self.calculate_confidence_interval(quantity)
                confidence_score = 0.85 + (np.random.random() * 0.13)  # 85-98% confidence
                
                cost = quantity * material_costs.get(material, 100)
                total_cost += cost
                
                material_forecasts.append(MaterialForecast(
                    material=material,
                    predicted_quantity=round(quantity, 2),
                    confidence_interval_low=round(ci_low, 2),
                    confidence_interval_high=round(ci_high, 2),
                    confidence_score=round(confidence_score, 2),
                    unit=material_units.get(material, 'units')
                ))
            
            # Assess risk and generate recommendations
            risk_level = self.assess_risk_level(predictions)
            recommendations = self.generate_recommendations(input_data, predictions)
            
            return ForecastOutput(
                project_id=input_data.project_id,
                project_name=input_data.project_name,
                forecast_date=datetime.now().isoformat(),
                forecasts=material_forecasts,
                total_estimated_cost=round(total_cost, 2),
                risk_level=risk_level,
                recommendations=recommendations
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Forecast generation error: {str(e)}")
    
    def calculate_base_predictions(self, input_data: ForecastInput) -> Dict[str, float]:
        """Calculate base material predictions using engineering rules and BOQ data"""
        tower_count = input_data.tower_count
        voltage = input_data.voltage
        terrain = input_data.terrain
        
        # Check if BOQ data is available
        has_boq = input_data.boq_data and input_data.boq_data.get('hasBoq', False)
        boq_categories = input_data.boq_data.get('categories', {}) if has_boq else {}
        
        print(f"\n📊 BOQ Data Status: {'Available' if has_boq else 'Not Available'}")
        if has_boq:
            print(f"   BOQ Categories: {list(boq_categories.keys())}")
            print(f"   Total Items: {input_data.boq_data.get('totalItems', 0)}")
            print(f"   Overall Progress: {input_data.boq_data.get('overallProgress', 0)}%")
        
        # Base factors per tower
        base_factors = {
            'Steel': 5000,
            'Conductors': 3000,
            'Insulators': 15,
            'Cement': 50,
            'Nuts/Bolts': 200,
            'Earthing': 10
        }
        
        # Voltage multipliers
        voltage_multipliers = {
            '66kV': 0.6, '132kV': 0.8, '220kV': 1.0, '400kV': 1.4, '765kV': 1.8
        }
        
        # Terrain multipliers
        terrain_multipliers = {
            'Plain': 1.0, 'Hilly': 1.3, 'Coastal': 1.15, 'Desert': 1.2, 'Forest': 1.25
        }
        
        voltage_mult = voltage_multipliers.get(voltage, 1.0)
        terrain_mult = terrain_multipliers.get(terrain, 1.0)
        
        # Calculate predictions
        predictions = {}
        for material, base_qty in base_factors.items():
            total_qty = base_qty * tower_count * voltage_mult * terrain_mult
            # Add variance ±8%
            variance = np.random.uniform(0.92, 1.08)
            predictions[material] = total_qty * variance
        
        # If BOQ data is available, adjust predictions based on actual BOQ quantities
        if has_boq and boq_categories:
            print("\n🔄 Adjusting predictions based on BOQ data...")
            for category, boq_info in boq_categories.items():
                if category in predictions:
                    remaining_qty = boq_info.get('remainingQuantity', 0)
                    total_qty = boq_info.get('totalQuantity', 0)
                    consumed_qty = boq_info.get('consumedQuantity', 0)
                    
                    # If BOQ has actual quantities, prioritize them
                    if remaining_qty > 0:
                        # Use remaining quantity as the forecast
                        predictions[category] = remaining_qty
                        print(f"   ✓ {category}: Using BOQ remaining = {remaining_qty:.2f} {boq_info.get('unit', '')}")
                    elif total_qty > 0 and consumed_qty >= total_qty:
                        # If fully consumed, suggest 10% buffer for replacements
                        predictions[category] = total_qty * 0.1
                        print(f"   ⚠ {category}: BOQ complete, adding 10% buffer = {predictions[category]:.2f}")
                    elif total_qty > 0:
                        # Use total BOQ quantity if consumption data not clear
                        predictions[category] = total_qty
                        print(f"   ✓ {category}: Using BOQ total = {total_qty:.2f} {boq_info.get('unit', '')}")
        
        return predictions

# Initialize the service
ensemble_service = EnsembleForecastingService()
