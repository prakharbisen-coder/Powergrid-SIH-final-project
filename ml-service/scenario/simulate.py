from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict

router = APIRouter()


# ---------- Pydantic Models ----------

class ScenarioInput(BaseModel):
    project_id: str
    region_id: str
    horizon_months: int = 6
    demand_change_percent: float = 0.0   # +20, -10 etc
    cost_change_percent: float = 0.0     # +10, -5 etc


class MaterialImpact(BaseModel):
    material_id: str
    material_name: str
    baseline_demand: List[float]              # forecast per month
    scenario_demand: List[float]
    baseline_projected_stock: List[float]     # stock per month
    scenario_projected_stock: List[float]
    baseline_shortage_months: int
    scenario_shortage_months: int
    extra_procurement_needed: float
    extra_cost: float


class ScenarioOutput(BaseModel):
    summary: Dict[str, float]
    materials: List[MaterialImpact]


# ---------- TEMP MOCKS (TO BE REPLACED BY BACKEND GUY) ----------

def get_forecast_mock(project_id: str, region_id: str, horizon_months: int):
    """
    Replace this with:
    - DB query, or
    - call to ML forecast microservice.

    Returns dict: {material_id: {"name": str, "monthly_forecast": [..]}}
    """

    # For now just 2 mock materials with 6 months demand
    return {
        "M101": {
            "name": "Tower Steel - Type A",
            "monthly_forecast": [100, 120, 130, 140, 150, 160][:horizon_months],
        },
        "M102": {
            "name": "ACSR Conductor X",
            "monthly_forecast": [200, 210, 220, 230, 240, 250][:horizon_months],
        },
    }


def get_inventory_mock(project_id: str, region_id: str):
    """
    Replace this with:
    - DB query to inventory tables, or
    - call to inventory service.

    Returns dict: {material_id: {"current_stock": float, "safety_stock": float, "unit_cost": float}}
    """

    return {
        "M101": {
            "current_stock": 400.0,
            "safety_stock": 100.0,
            "unit_cost": 2000.0,
        },
        "M102": {
            "current_stock": 900.0,
            "safety_stock": 200.0,
            "unit_cost": 5000.0,
        },
    }


# ---------- MAIN ENDPOINT ----------

@router.post("/run", response_model=ScenarioOutput)
def run_scenario(data: ScenarioInput):
    """
    Scenario simulation:

    - Uses baseline forecast (per material, per month)
    - Uses current stock + safety stock + unit cost
    - Applies demand_change_percent and cost_change_percent
    - Simulates month-wise stock levels
    - Counts shortage months and extra cost required to restore safety stock
    """

    # In future: swap these mocks with real functions
    forecast_data = get_forecast_mock(data.project_id, data.region_id, data.horizon_months)
    inventory_data = get_inventory_mock(data.project_id, data.region_id)

    demand_factor = 1.0 + data.demand_change_percent / 100.0
    cost_factor = 1.0 + data.cost_change_percent / 100.0

    materials_output: List[MaterialImpact] = []

    total_extra_cost = 0.0
    total_materials = 0
    base_risk_materials = 0
    scenario_risk_materials = 0

    for material_id, f in forecast_data.items():
        total_materials += 1

        name = f["name"]
        baseline_demand = f["monthly_forecast"]
        horizon = len(baseline_demand)

        scenario_demand = [round(x * demand_factor, 2) for x in baseline_demand]

        inv = inventory_data.get(material_id, {
            "current_stock": 0.0,
            "safety_stock": 0.0,
            "unit_cost": 0.0,
        })

        current_stock = float(inv["current_stock"])
        safety_stock = float(inv["safety_stock"])
        unit_cost = float(inv["unit_cost"]) * cost_factor

        baseline_stock_series: List[float] = []
        scenario_stock_series: List[float] = []
        baseline_shortage_months = 0
        scenario_shortage_months = 0

        stock_baseline = current_stock
        stock_scenario = current_stock

        for month in range(horizon):
            stock_baseline -= baseline_demand[month]
            stock_scenario -= scenario_demand[month]

            baseline_stock_series.append(round(stock_baseline, 2))
            scenario_stock_series.append(round(stock_scenario, 2))

            if stock_baseline < safety_stock:
                baseline_shortage_months += 1
            if stock_scenario < safety_stock:
                scenario_shortage_months += 1

        extra_procurement_needed = 0.0
        extra_cost = 0.0

        final_stock_scenario = scenario_stock_series[-1] if scenario_stock_series else current_stock
        if final_stock_scenario < safety_stock:
            extra_procurement_needed = round(safety_stock - final_stock_scenario, 2)
            extra_cost = round(extra_procurement_needed * unit_cost, 2)
            total_extra_cost += extra_cost

        if baseline_shortage_months > 0:
            base_risk_materials += 1
        if scenario_shortage_months > 0:
            scenario_risk_materials += 1

        materials_output.append(MaterialImpact(
            material_id=material_id,
            material_name=name,
            baseline_demand=baseline_demand,
            scenario_demand=scenario_demand,
            baseline_projected_stock=baseline_stock_series,
            scenario_projected_stock=scenario_stock_series,
            baseline_shortage_months=baseline_shortage_months,
            scenario_shortage_months=scenario_shortage_months,
            extra_procurement_needed=extra_procurement_needed,
            extra_cost=extra_cost,
        ))

    summary = {
        "total_materials": total_materials,
        "materials_at_risk_baseline": base_risk_materials,
        "materials_at_risk_scenario": scenario_risk_materials,
        "total_extra_cost": round(total_extra_cost, 2),
        "avg_demand_change_percent": data.demand_change_percent,
        "avg_cost_change_percent": data.cost_change_percent,
    }

    return ScenarioOutput(summary=summary, materials=materials_output)
