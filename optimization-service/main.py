"""
Budget Optimization Service
FastAPI + PuLP Linear Programming for Vendor Allocation
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import json
import pulp
from pathlib import Path

app = FastAPI(
    title="Budget Optimization API",
    description="Smart vendor allocation using Linear Programming",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== DATA MODELS ====================

class Vendor(BaseModel):
    vendor_id: str
    vendor_name: str
    company_name: str
    location: str
    specializations: List[str]
    prices: Dict[str, float]
    reliability_score: float
    lead_time_days: int
    capacity: int
    available: bool = True
    payment_terms: str
    rating: float
    total_orders: int

class Material(BaseModel):
    material_id: str
    material_name: str
    category: str
    required_quantity: float
    unit: str
    urgency: str
    description: str

class OptimizationRequest(BaseModel):
    materials: List[Dict]  # [{"category": "Steel", "quantity": 100}]
    budget: float
    max_lead_time: Optional[int] = 30
    vendors: Optional[List[Dict]] = None  # Optional: use uploaded vendors

class SimulationRequest(BaseModel):
    materials: List[Dict]
    budget_scenarios: List[float]  # Test multiple budgets
    max_lead_time: Optional[int] = 30

class VendorDownRequest(BaseModel):
    materials: List[Dict]
    budget: float
    unavailable_vendors: List[str]  # Vendor IDs to mark as unavailable
    max_lead_time: Optional[int] = 30

# ==================== DATA LOADER ====================

def load_data():
    """Load vendors and materials from JSON files"""
    try:
        vendors_path = Path("data/vendors.json")
        materials_path = Path("data/materials.json")
        
        with open(vendors_path, 'r') as f:
            vendors = json.load(f)
        
        with open(materials_path, 'r') as f:
            materials = json.load(f)
        
        return vendors, materials
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=f"Data files not found. Run data_generator.py first. Error: {str(e)}")
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON format: {str(e)}")

# ==================== OPTIMIZATION ENGINE ====================

def optimize_vendor_allocation(
    materials_req: List[Dict],
    vendors: List[Dict],
    budget: float,
    max_lead_time: int = 30
):
    """
    Linear Programming Optimization using PuLP
    
    Objective: Minimize total cost while maximizing reliability
    
    Decision Variables: qty_from_each_vendor_for_each_material
    
    Constraints:
    1. Total quantity from all vendors = required quantity (for each material)
    2. Total cost ≤ budget
    3. Vendor lead time ≤ max_lead_time
    4. Only use available vendors
    5. Respect vendor capacity limits
    """
    
    # Create LP problem (Minimization)
    prob = pulp.LpProblem("Vendor_Allocation_Optimization", pulp.LpMinimize)
    
    # Decision variables: qty[vendor_id][material_category]
    decision_vars = {}
    
    # Build decision variables for each vendor-material combination
    for vendor in vendors:
        if not vendor.get('available', True):
            continue
        if vendor['lead_time_days'] > max_lead_time:
            continue
            
        vendor_id = vendor['vendor_id']
        decision_vars[vendor_id] = {}
        
        for material in materials_req:
            category = material['category']
            
            # Check if vendor supplies this material
            if category in vendor.get('specializations', []) and category in vendor.get('prices', {}):
                # Create decision variable (quantity to order from this vendor)
                var_name = f"qty_{vendor_id}_{category}"
                decision_vars[vendor_id][category] = pulp.LpVariable(
                    var_name, 
                    lowBound=0, 
                    upBound=vendor['capacity'],
                    cat='Continuous'
                )
    
    # Objective Function: Minimize (Cost - Reliability Bonus)
    # Cost component
    cost_terms = []
    for vendor in vendors:
        vendor_id = vendor['vendor_id']
        if vendor_id not in decision_vars:
            continue
            
        for category, var in decision_vars[vendor_id].items():
            price = vendor['prices'][category]
            cost_terms.append(price * var)
    
    # Reliability bonus (subtract small amount to prefer reliable vendors)
    reliability_terms = []
    for vendor in vendors:
        vendor_id = vendor['vendor_id']
        if vendor_id not in decision_vars:
            continue
            
        reliability_score = vendor['reliability_score']
        for category, var in decision_vars[vendor_id].items():
            # Subtract 0.01 * reliability per unit to favor reliable vendors
            reliability_terms.append(-0.01 * reliability_score * var)
    
    # Combined objective
    prob += pulp.lpSum(cost_terms) + pulp.lpSum(reliability_terms), "Total_Cost_Minus_Reliability"
    
    # Constraint 1: Meet required quantity for each material
    for material in materials_req:
        category = material['category']
        required_qty = material['quantity']
        
        # Sum of quantities from all vendors for this material
        supplier_vars = []
        for vendor_id, materials_dict in decision_vars.items():
            if category in materials_dict:
                supplier_vars.append(materials_dict[category])
        
        if supplier_vars:
            prob += pulp.lpSum(supplier_vars) == required_qty, f"Meet_Demand_{category}"
    
    # Constraint 2: Total cost ≤ budget
    total_cost = []
    for vendor in vendors:
        vendor_id = vendor['vendor_id']
        if vendor_id not in decision_vars:
            continue
            
        for category, var in decision_vars[vendor_id].items():
            price = vendor['prices'][category]
            total_cost.append(price * var)
    
    prob += pulp.lpSum(total_cost) <= budget, "Budget_Limit"
    
    # Solve the problem
    solver = pulp.PULP_CBC_CMD(msg=0)  # Silent solver
    status = prob.solve(solver)
    
    # Extract results
    if status != pulp.LpStatusOptimal:
        return {
            "success": False,
            "status": pulp.LpStatus[status],
            "message": "No optimal solution found. Try increasing budget or relaxing constraints."
        }
    
    # Build allocation results
    allocations = []
    total_cost_actual = 0
    
    for vendor in vendors:
        vendor_id = vendor['vendor_id']
        if vendor_id not in decision_vars:
            continue
            
        for category, var in decision_vars[vendor_id].items():
            qty = var.varValue
            if qty and qty > 0.01:  # Only include non-zero allocations
                price = vendor['prices'][category]
                subtotal = price * qty
                total_cost_actual += subtotal
                
                allocations.append({
                    "vendor_id": vendor_id,
                    "vendor_name": vendor['vendor_name'],
                    "company_name": vendor['company_name'],
                    "location": vendor['location'],
                    "material_category": category,
                    "quantity": round(qty, 2),
                    "unit_price": round(price, 2),
                    "subtotal": round(subtotal, 2),
                    "reliability_score": vendor['reliability_score'],
                    "lead_time_days": vendor['lead_time_days'],
                    "rating": vendor.get('rating', 0)
                })
    
    # Calculate savings
    # Compare with naive approach (buying from most expensive vendors)
    naive_cost = 0
    for material in materials_req:
        category = material['category']
        qty = material['quantity']
        
        # Find max price for this category
        max_price = 0
        for vendor in vendors:
            if category in vendor.get('prices', {}):
                max_price = max(max_price, vendor['prices'][category])
        
        naive_cost += max_price * qty
    
    savings = naive_cost - total_cost_actual
    savings_percent = (savings / naive_cost * 100) if naive_cost > 0 else 0
    
    return {
        "success": True,
        "status": "Optimal",
        "allocations": allocations,
        "summary": {
            "total_cost": round(total_cost_actual, 2),
            "budget": budget,
            "budget_used_percent": round((total_cost_actual / budget * 100), 2),
            "remaining_budget": round(budget - total_cost_actual, 2),
            "total_vendors_used": len(set(a['vendor_id'] for a in allocations)),
            "naive_cost": round(naive_cost, 2),
            "savings": round(savings, 2),
            "savings_percent": round(savings_percent, 2),
            "avg_reliability": round(sum(a['reliability_score'] * a['quantity'] for a in allocations) / sum(a['quantity'] for a in allocations), 2) if allocations else 0,
            "max_lead_time": max((a['lead_time_days'] for a in allocations), default=0)
        }
    }

# ==================== API ENDPOINTS ====================

@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "service": "Budget Optimization API",
        "status": "running",
        "version": "1.0.0",
        "endpoints": ["/data", "/optimize", "/simulate", "/vendor_down"]
    }

@app.get("/data")
def get_data():
    """Get sample vendors and materials data"""
    try:
        vendors, materials = load_data()
        return {
            "success": True,
            "vendors": vendors,
            "materials": materials,
            "summary": {
                "total_vendors": len(vendors),
                "available_vendors": sum(1 for v in vendors if v.get('available', True)),
                "total_materials": len(materials)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/optimize")
def optimize_allocation(request: OptimizationRequest):
    """
    Perform Linear Programming cost optimization
    
    Request body:
    {
        "materials": [{"category": "Steel", "quantity": 100}],
        "budget": 500000,
        "max_lead_time": 20
    }
    """
    try:
        # Load vendor data
        vendors_data, _ = load_data()
        
        # Use uploaded vendors if provided, otherwise use default
        vendors = request.vendors if request.vendors else vendors_data
        
        # Validate materials
        if not request.materials:
            raise HTTPException(status_code=400, detail="Materials list cannot be empty")
        
        # Run optimization
        result = optimize_vendor_allocation(
            materials_req=request.materials,
            vendors=vendors,
            budget=request.budget,
            max_lead_time=request.max_lead_time
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

@app.post("/simulate")
def simulate_budget_scenarios(request: SimulationRequest):
    """
    Test multiple budget scenarios to find optimal budget
    
    Request body:
    {
        "materials": [{"category": "Steel", "quantity": 100}],
        "budget_scenarios": [300000, 400000, 500000, 600000],
        "max_lead_time": 20
    }
    """
    try:
        vendors, _ = load_data()
        
        results = []
        for budget in request.budget_scenarios:
            result = optimize_vendor_allocation(
                materials_req=request.materials,
                vendors=vendors,
                budget=budget,
                max_lead_time=request.max_lead_time
            )
            
            results.append({
                "budget": budget,
                "success": result.get('success', False),
                "total_cost": result.get('summary', {}).get('total_cost', 0),
                "savings": result.get('summary', {}).get('savings', 0),
                "vendors_used": result.get('summary', {}).get('total_vendors_used', 0),
                "feasible": result.get('success', False)
            })
        
        return {
            "success": True,
            "scenarios": results,
            "recommendation": min(
                [r for r in results if r['feasible']], 
                key=lambda x: x['total_cost'],
                default=None
            ) if any(r['feasible'] for r in results) else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

@app.post("/vendor_down")
def vendor_unavailability_simulation(request: VendorDownRequest):
    """
    Simulate vendor unavailability scenario
    
    Request body:
    {
        "materials": [{"category": "Steel", "quantity": 100}],
        "budget": 500000,
        "unavailable_vendors": ["VEN-OPT-0001", "VEN-OPT-0005"],
        "max_lead_time": 20
    }
    """
    try:
        vendors, _ = load_data()
        
        # Mark specified vendors as unavailable
        for vendor in vendors:
            if vendor['vendor_id'] in request.unavailable_vendors:
                vendor['available'] = False
        
        # Run optimization with vendor constraints
        result = optimize_vendor_allocation(
            materials_req=request.materials,
            vendors=vendors,
            budget=request.budget,
            max_lead_time=request.max_lead_time
        )
        
        return {
            **result,
            "simulation_info": {
                "unavailable_vendors": request.unavailable_vendors,
                "total_vendors_in_pool": len(vendors),
                "available_vendors": sum(1 for v in vendors if v.get('available', True))
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vendor down simulation failed: {str(e)}")

# ==================== RUN SERVER ====================

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Budget Optimization Service...")
    print("📊 Endpoints: /data, /optimize, /simulate, /vendor_down")
    print("🌐 API Docs: http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001)
