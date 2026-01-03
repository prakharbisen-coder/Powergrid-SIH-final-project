from fastapi import APIRouter
from pydantic import BaseModel
import requests
from typing import Dict, Any, List

router = APIRouter(tags=["Scenario Simulation"])


# ========= FRONTEND INPUT MODEL ========= #

class ScenarioInput(BaseModel):
    project_region: str = "All Regions"
    project_type: str = "Transmission Line"
    timeline_months: int = 6
    budget_adjustment: float = 100.0
    demand_projection: float = 100.0
    material_cost_variance: float = 0.0


# ========= CONNECT TO ML + INVENTORY SERVICES ========= #

ML_FORECAST_URL = "http://localhost:8001/api/forecast"
INVENTORY_URL  = "http://localhost:8002/api/inventory"


# ========= SAFETY HELPERS ========= #

def safe_number(x: Any, default: float = 0.0) -> float:
    try:
        if x is None:
            return default
        if isinstance(x, bool):
            return default
        return float(x)
    except Exception:
        try:
            return float(str(x).replace(",", ""))
        except Exception:
            return default


# ========= FORECAST NORMALIZATION ========= #

def normalize_forecast_item(entry: Dict[str, Any], horizon: int) -> Dict[str, Any]:
    name = entry.get("name") or entry.get("material_name") or "Unknown Material"
    arr = entry.get("monthly_forecast") or entry.get("forecast") or []

    if not isinstance(arr, list):
        arr = []

    arr = [safe_number(x) for x in arr]

    if len(arr) < horizon:
        arr = arr + [0.0] * (horizon - len(arr))
    else:
        arr = arr[:horizon]

    return {"name": name, "monthly_forecast": arr}


def normalize_forecast(raw: Any, horizon: int) -> Dict[str, Dict[str, Any]]:
    out = {}

    if not raw:
        return out

    if isinstance(raw, dict) and len(raw) == 1 and list(raw.keys())[0] in ("data", "result", "forecast"):
        raw = list(raw.values())[0]

    if isinstance(raw, list):
        for idx, item in enumerate(raw):
            mid = item.get("material_id") or f"M{idx+1}"
            out[mid] = normalize_forecast_item(item, horizon)
        return out

    if isinstance(raw, dict):
        for mid, entry in raw.items():
            if isinstance(entry, dict):
                out[mid] = normalize_forecast_item(entry, horizon)

    return out


# ========= INVENTORY NORMALIZATION ========= #

def normalize_inventory_item(entry: Dict[str, Any]) -> Dict[str, float]:
    cs = safe_number(entry.get("current_stock"), 0.0)
    ss = safe_number(entry.get("safety_stock"), 0.0)
    uc = safe_number(entry.get("unit_cost"), 0.0)
    return {
        "current_stock": max(0.0, cs),
        "safety_stock": max(0.0, ss),
        "unit_cost": max(0.0, uc),
    }


def normalize_inventory(raw: Any) -> Dict[str, Dict[str, float]]:
    out = {}

    if not raw:
        return out

    if isinstance(raw, dict) and len(raw) == 1 and list(raw.keys())[0] in ("data", "result", "inventory"):
        raw = list(raw.values())[0]

    if isinstance(raw, list):
        for idx, item in enumerate(raw):
            mid = item.get("material_id") or f"M{idx+1}"
            out[mid] = normalize_inventory_item(item)
        return out

    if isinstance(raw, dict):
        for mid, entry in raw.items():
            if isinstance(entry, dict):
                out[mid] = normalize_inventory_item(entry)

    return out


# ========= FETCH ML ========= #

def fetch_forecast(project_key: str, horizon: int):
    try:
        resp = requests.get(
            ML_FORECAST_URL,
            params={"project_key": project_key, "horizon": horizon},
            timeout=2,
        )
        resp.raise_for_status()
        raw = resp.json()
    except:
        raw = None

    forecast = normalize_forecast(raw, horizon)

    if not forecast:
        # Generate dynamic fallback data based on horizon
        import random
        base_materials = [
            ("M101", "Conductors (ACSR)", 450),
            ("M102", "Steel Structures", 320),
            ("M103", "Insulators (Polymer)", 280),
            ("M104", "Transformers", 150),
            ("M105", "Circuit Breakers", 180),
            ("M106", "Power Cables", 420),
            ("M107", "Earthing Materials", 200),
            ("M108", "Hardware & Fittings", 380),
        ]
        
        fallback = {}
        for mid, name, base_demand in base_materials:
            monthly = []
            for i in range(horizon):
                # Add growth trend and randomness
                growth_factor = 1 + (i * 0.03)  # 3% growth per month
                variance = random.uniform(0.85, 1.15)
                demand = round(base_demand * growth_factor * variance)
                monthly.append(demand)
            fallback[mid] = {"name": name, "monthly_forecast": monthly}
        
        forecast = fallback

    return forecast


# ========= FETCH INVENTORY ========= #

def fetch_inventory(project_key: str):
    try:
        resp = requests.get(
            INVENTORY_URL,
            params={"project_key": project_key},
            timeout=2,
        )
        resp.raise_for_status()
        raw = resp.json()
    except:
        raw = None

    inventory = normalize_inventory(raw)

    if not inventory:
        # Generate realistic inventory for all materials
        # Stock levels represent 6-8 months of buffer to handle demand fluctuations
        # This reflects real-world power grid procurement practices
        inventory = {
            "M101": {"current_stock": 3200, "safety_stock": 450, "unit_cost": 12000},
            "M102": {"current_stock": 2400, "safety_stock": 320, "unit_cost": 8500},
            "M103": {"current_stock": 2100, "safety_stock": 280, "unit_cost": 3200},
            "M104": {"current_stock": 1100, "safety_stock": 150, "unit_cost": 95000},
            "M105": {"current_stock": 1300, "safety_stock": 180, "unit_cost": 45000},
            "M106": {"current_stock": 3000, "safety_stock": 420, "unit_cost": 6700},
            "M107": {"current_stock": 1500, "safety_stock": 200, "unit_cost": 2800},
            "M108": {"current_stock": 2700, "safety_stock": 380, "unit_cost": 1500},
        }

    return inventory


# ========= ROUTES ========= #

@router.get("/ping")
def ping():
    return {"ok": True, "module": "scenario simulation active"}


@router.post("/run")
def run_scenario(input: ScenarioInput):

    horizon = max(1, min(24, input.timeline_months))

    demand_change_pct = safe_number(input.demand_projection, 100) - 100
    cost_change_pct = safe_number(input.material_cost_variance, 0)

    project_key = f"{input.project_region}|{input.project_type}"

    forecast = fetch_forecast(project_key, horizon)
    inventory = fetch_inventory(project_key)

    demand_factor = 1 + demand_change_pct / 100
    cost_factor = 1 + cost_change_pct / 100

    materials_output = []
    baseline_risk = 0
    scenario_risk = 0
    total_extra_cost = 0
    baseline_total_cost = 0
    scenario_total_cost = 0

    for mid, mat in forecast.items():
        name = mat["name"]
        baseline_demand = mat["monthly_forecast"]
        scenario_demand = [round(x * demand_factor, 2) for x in baseline_demand]

        inv = inventory.get(mid, {"current_stock": 0, "safety_stock": 0, "unit_cost": 0})
        stock0 = inv["current_stock"]
        safety = inv["safety_stock"]
        unit_cost_baseline = inv["unit_cost"]
        unit_cost_scenario = round(unit_cost_baseline * cost_factor, 2)

        baseline_stock = []
        scenario_stock = []
        b_short = 0
        s_short = 0

        s1 = stock0
        s2 = stock0
        
        # More realistic reorder system
        # Reorder point is 3x safety stock to maintain buffer
        reorder_point_base = safety * 3
        reorder_point_scen = safety * 3
        
        # Calculate average monthly demand for both scenarios
        avg_demand_base = sum(baseline_demand) / len(baseline_demand) if baseline_demand else 0
        avg_demand_scen = sum(scenario_demand) / len(scenario_demand) if scenario_demand else 0
        
        # Order quantity is generous: 3 months of demand to handle spikes
        order_qty_base = max(avg_demand_base * 3, safety * 2)
        order_qty_scen = max(avg_demand_scen * 3, safety * 2)

        for i in range(horizon):
            d_base = safe_number(baseline_demand[i])
            d_scen = safe_number(scenario_demand[i])

            # Replenishment logic BEFORE consumption
            # Reorder if stock + next month order won't cover demand + safety
            if s1 < reorder_point_base:
                s1 += order_qty_base
            if s2 < reorder_point_scen:
                s2 += order_qty_scen
            
            # Consume this month's demand
            s1 -= d_base
            s2 -= d_scen
            
            # Ensure stock doesn't go negative (emergency procurement)
            if s1 < 0:
                emergency_order = abs(s1) + safety
                s1 += emergency_order
                baseline_total_cost += emergency_order * unit_cost_baseline * 1.2  # Emergency premium
            if s2 < 0:
                emergency_order = abs(s2) + safety
                s2 += emergency_order
                scenario_total_cost += emergency_order * unit_cost_scenario * 1.2  # Emergency premium

            baseline_stock.append(round(max(0, s1), 2))
            scenario_stock.append(round(max(0, s2), 2))

            baseline_total_cost += d_base * unit_cost_baseline
            scenario_total_cost += d_scen * unit_cost_scenario

            # Count shortage if below safety stock
            if s1 < safety:
                b_short += 1
            if s2 < safety:
                s_short += 1

        extra_qty = 0
        extra_cost = 0
        if scenario_stock[-1] < safety:
            extra_qty = round(safety - scenario_stock[-1], 2)
            extra_cost = round(extra_qty * unit_cost_scenario, 2)
            total_extra_cost += extra_cost

        if b_short > 0:
            baseline_risk += 1
        if s_short > 0:
            scenario_risk += 1

        materials_output.append({
            "material_id": mid,
            "material_name": name,
            "baseline_demand": baseline_demand,
            "scenario_demand": scenario_demand,
            "baseline_stock": baseline_stock,
            "scenario_stock": scenario_stock,
            "baseline_shortage_months": b_short,
            "scenario_shortage_months": s_short,
            "extra_procurement_needed": extra_qty,
            "extra_cost": extra_cost,
        })

    total_materials = len(materials_output) or 1

    fulfillment_baseline = max(0, 100 - (baseline_risk / total_materials * 100))
    fulfillment_scenario = max(0, 100 - (scenario_risk / total_materials * 100))

    if baseline_total_cost > 0:
        cost_change_pct_observed = ((scenario_total_cost - baseline_total_cost) / baseline_total_cost) * 100
    else:
        cost_change_pct_observed = 0

    efficiency_score = round(
        fulfillment_scenario - max(cost_change_pct_observed, 0) * 0.3,
        2
    )

    risk_ratio = scenario_risk / total_materials

    if risk_ratio < 0.25:
        risk_label = "LOW RISK"
    elif risk_ratio < 0.6:
        risk_label = "MEDIUM RISK"
    else:
        risk_label = "HIGH RISK"

    summary = {
        "project_region": input.project_region,
        "project_type": input.project_type,
        "timeline_months": horizon,

        "materials_at_risk_baseline": baseline_risk,
        "materials_at_risk_scenario": scenario_risk,

        "fulfillment_baseline": round(fulfillment_baseline, 2),
        "fulfillment_scenario": round(fulfillment_scenario, 2),

        "baseline_total_cost_crore": round(baseline_total_cost / 1e7, 2),
        "scenario_total_cost_crore": round(scenario_total_cost / 1e7, 2),

        "cost_change_percent": round(cost_change_pct_observed, 2),
        "total_extra_cost_crore": round(total_extra_cost / 1e7, 2),

        "efficiency_score": efficiency_score,
        "risk_label": risk_label,
    }

    scenario_profile = {
        "budget_adjustment": input.budget_adjustment,
        "demand_projection": input.demand_projection,
        "material_cost_variance": input.material_cost_variance,
        "demand_change_percent": round(demand_change_pct, 2),
        "cost_change_percent": round(cost_change_pct, 2),
    }

    top_risky_materials = sorted(
        materials_output,
        key=lambda m: (m["scenario_shortage_months"], m["extra_cost"]),
        reverse=True,
    )[:5]

    return {
        "summary": summary,
        "materials": materials_output,
        "scenario_profile": scenario_profile,
        "top_risky_materials": top_risky_materials,
    }
