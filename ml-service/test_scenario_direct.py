"""
Direct test of scenario simulation module without running the server
"""
from scenario.simulate import run_scenario, ScenarioInput

def test_scenario():
    print("=" * 60)
    print("Direct Scenario Simulation Test")
    print("=" * 60)
    
    # Create test input
    test_input = ScenarioInput(
        project_id="P001",
        region_id="R001",
        horizon_months=6,
        demand_change_percent=10.0,
        cost_change_percent=5.0
    )
    
    print("\nTest Input:")
    print(f"  Project ID: {test_input.project_id}")
    print(f"  Region ID: {test_input.region_id}")
    print(f"  Horizon: {test_input.horizon_months} months")
    print(f"  Demand Change: +{test_input.demand_change_percent}%")
    print(f"  Cost Change: +{test_input.cost_change_percent}%")
    
    print("\nRunning scenario simulation...")
    try:
        result = run_scenario(test_input)
        
        print("\n✅ SUCCESS! Scenario simulation completed.\n")
        
        # Print summary
        print("Summary:")
        print(f"  Total Materials: {result.summary['total_materials']}")
        print(f"  At Risk (Baseline): {result.summary['materials_at_risk_baseline']}")
        print(f"  At Risk (Scenario): {result.summary['materials_at_risk_scenario']}")
        print(f"  Total Extra Cost: ₹{result.summary['total_extra_cost']:,.2f}")
        
        # Print materials detail
        print("\nMaterial Details:")
        for mat in result.materials:
            print(f"\n  {mat.material_name} ({mat.material_id}):")
            print(f"    Baseline Shortage Months: {mat.baseline_shortage_months}")
            print(f"    Scenario Shortage Months: {mat.scenario_shortage_months}")
            if mat.extra_procurement_needed > 0:
                print(f"    Extra Procurement Needed: {mat.extra_procurement_needed} units")
                print(f"    Extra Cost: ₹{mat.extra_cost:,.2f}")
        
        print("\n" + "=" * 60)
        print("✅ Test PASSED - Scenario simulation is working!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        print("\n" + "=" * 60)
        print("❌ Test FAILED")
        print("=" * 60)

if __name__ == "__main__":
    test_scenario()
