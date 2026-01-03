from fastapi import APIRouter
from pydantic import BaseModel
import requests
from typing import Any, Dict, List

# ROUTER
router = APIRouter()

# ===============================
# INPUT MODEL
# ===============================
class ScenarioInput(BaseModel):
    project_id: str
    region_id: str
    horizon_months: int = 6
    demand_change_percent: float = 0.0
    cost_change_percent: float = 0.0


# ===============================
# EXTERNAL API URLs (EDIT THESE)
# ===============================

ML_FORECAST_URL = "http://localhost:8001/api/forecast"     # ML TEAM ENDPOINT
INVENTORY_URL  = "http://localhost:8002/api/inventory"    # INVENTORY TEAM ENDPOINT


# ===============================
# SAFE HELPERS
# ===============================

def safe_number(x, default=0.0):
    """Convert anything to float safely."""
    try:
        if x is None: 
            return default
        if isinstance(x, bool): 
            return default
        return float(x)
    except:
        try:
            return float(str(x).replace(",", ""))
        except:
            return default


def normalize_forecast(raw, horizon):
    """Normalize ML forecast into a safe dictionary."""
    out = {}

    if not raw:
        return {}

    # handle wrapper keys like {"data": {...}}
    if isinstance(raw, dict) and len(raw) == 1 and list(raw.keys())[0] in ("data", "result", "forecast"):
        raw = list(raw.values())[0] or {}

    # if list → convert to dict
    if isinstance(raw, list):
        for idx, item in enumerate(raw):
            mid = item.get("material_id") or f"M{idx+1}"
            out[mid] = normalize_forecast_item(item, horizon)
        return out

    # normal dict
    for mid, entry in raw.items():
        out[mid] = normalize_forecast_item(entry, horizon)

    return out


def normalize_forecast_item(entry, horizon):
    """Normalize single material forecast entry."""
    name = entry.get("name") or entry.get("material_name") or "Unknown Material"
    arr = entry.get("monthly_forecast") or entry.get("forecast") or []

    # If not list, convert
    if not isinstance(arr, list):
        arr = []

    arr = [safe_number(x) for x in arr]

    # pad or truncate
    if len(arr) < horizon:
        arr = arr + [0.0] * (horizon - len(arr))
    else:
        arr = arr[:horizon]

    return {
        "name": name,
        "monthly_forecast": arr
    }


def normalize_inventory(raw):
    """Normalize inventory into safe dictionary."""
    out = {}

    if not raw:
        return {}

    # wrapper
    if isinstance(raw, dict) and len(raw) == 1 and list(raw.keys())[0] in ("data", "result", "inventory"):
        raw = list(raw.values())[0] or {}

    # list → convert to dict
    if isinstance(raw, list):
        for idx, item in enumerate(raw):
            mid = item.get("material_id") or f"M{idx+1}"
            out[mid] = normalize_inventory_item(item)
        return out

    for mid, entry in raw.items():
        out[mid] = normalize_inventory_item(entry)

    return out


def normalize_inventory_item(entry):
    """Normalize single inventory entry."""
    cs = safe_number(entry.get("current_stock", 0))
    ss = safe_number(entry.get("safety_stock", 0))
    uc = safe_number(entry.get("unit_cost", 0))

    return {
        "current_stock": max(0, cs),
        "safety_stock": max(0, ss),
        "unit_cost": max(0, uc),
    }


# ===============================
# FETCHERS WITH FALLBACKS
# ===============================

def fetch_forecast(project_id, region_id, horizon):
    try:
        response = requests.get(
            ML_FORECAST_URL,
            params={"project_id": project_id, "region_id": region_id, "horizon": horizon},
            timeout=5
        )
        response.raise_for_status()
        raw = response.json()
    except:
        raw = None

    forecast = normalize_forecast(raw, horizon)

    # fallback if empty
    if not forecast:
        forecast = {
            "M101": {"name": "Tower Steel A", "monthly_forecast": [100.0] * horizon},
            "M102": {"name": "Conductor X",   "monthly_forecast": [200.0] * horizon},
        }

    return forecast


def fetch_inventory(project_id, region_id):
    try:
        response = requests.get(
            INVENTORY_URL,
            params={"project_id": project_id, "region_id": region_id},
            timeout=5
        )
        response.raise_for_status()
        raw = response.json()
    except:
        raw = None

    inventory = normalize_inventory(raw)

    if not inventory:
        inventory = {
            "M101": {"current_stock": 400.0, "safety_stock": 100.0, "unit_cost": 2000.0},
            "M102": {"current_stock": 900.0, "safety_stock": 200.0, "unit_cost": 5000.0},
        }

    return inventory


# ===============================
# TEST ENDPOINT
# ===============================
@router.get("/ping")
def ping():
    return {"ok": True, "module": "scenario simulation active"}


# ===============================
# MAIN SIMULATION
# ===============================
@router.post("/run")
def run_simulation(input: ScenarioInput):

    horizon = max(1, min(24, input.horizon_months))

    # Fetch safe ML & inventory
    forecast = fetch_forecast(input.project_id, input.region_id, horizon)
    inventory = fetch_inventory(input.project_id, input.region_id)

    demand_factor = 1 + (safe_number(input.demand_change_percent) / 100)
    cost_factor   = 1 + (safe_number(input.cost_change_percent) / 100)

    materials_output = []
    total_extra_cost = 0
    baseline_risk = 0
    scenario_risk = 0

    for mid, material in forecast.items():
        name = material["name"]
        baseline_demand = material["monthly_forecast"]
        scenario_demand = [round(x * demand_factor, 2) for x in baseline_demand]

        inv = inventory.get(mid, {"current_stock": 0, "safety_stock": 0, "unit_cost": 0})

        current_stock = inv["current_stock"]
        safety_stock  = inv["safety_stock"]
        unit_cost     = round(inv["unit_cost"] * cost_factor, 2)

        baseline_stock = []
        scenario_stock = []

        b_short = 0
        s_short = 0

        # baseline simulation
        s1 = current_stock
        for d in baseline_demand:
            s1 -= safe_number(d)
            baseline_stock.append(round(s1, 2))
            if s1 < safety_stock:
                b_short += 1

        # scenario simulation
        s2 = current_stock
        for d in scenario_demand:
            s2 -= safe_number(d)
            scenario_stock.append(round(s2, 2))
            if s2 < safety_stock:
                s_short += 1

        # extra procurement needed
        extra_qty = 0
        extra_cost = 0
        if s2 < safety_stock:
            extra_qty = round(safety_stock - s2, 2)
            extra_cost = round(extra_qty * unit_cost, 2)
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

    summary = {
        "total_materials": len(materials_output),
        "materials_at_risk_baseline": baseline_risk,
        "materials_at_risk_scenario": scenario_risk,
        "total_extra_cost": total_extra_cost,
    }

    return {
        "summary": summary,
        "materials": materials_output
    }
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
