"""
Direct test of forecasting service without running the server
"""
import asyncio
from forecasting_service import ensemble_service, ForecastInput

async def test_forecast():
    print("=" * 60)
    print("Direct Forecast Service Test")
    print("=" * 60)
    
    # Create test input
    test_input = ForecastInput(
        project_id="TEST-001",
        project_name="Test Transmission Project",
        tower_count=100,
        voltage="400kV",
        tower_type="Lattice",
        terrain="hilly",
        region="west",
        start_date="2024-01-01T00:00:00Z",
        end_date="2025-12-31T23:59:59Z"
    )
    
    print("\nTest Input:")
    print(f"  Project: {test_input.project_name}")
    print(f"  Towers: {test_input.tower_count}")
    print(f"  Voltage: {test_input.voltage}")
    print(f"  Type: {test_input.tower_type}")
    print(f"  Terrain: {test_input.terrain}")
    print(f"  Region: {test_input.region}")
    
    print("\nRunning forecast generation...")
    try:
        result = await ensemble_service.generate_forecast(test_input)
        
        print("\n✅ SUCCESS! Forecast generation completed.\n")
        
        # Print summary
        print(f"Project: {result.project_name}")
        print(f"Risk Level: {result.risk_level}")
        print(f"Total Estimated Cost: ₹{result.total_estimated_cost:,.2f}")
        
        # Print material forecasts
        print("\nMaterial Forecasts:")
        for forecast in result.forecasts:
            print(f"\n  {forecast.material}:")
            print(f"    Predicted Quantity: {forecast.predicted_quantity:,.2f} {forecast.unit}")
            print(f"    Confidence: {forecast.confidence_score * 100:.1f}%")
            print(f"    Range: {forecast.confidence_interval_low:,.2f} - {forecast.confidence_interval_high:,.2f}")
        
        # Print recommendations
        print("\nRecommendations:")
        for i, rec in enumerate(result.recommendations, 1):
            print(f"  {i}. {rec}")
        
        print("\n" + "=" * 60)
        print("✅ Test PASSED - Forecast service is working!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        print("\n" + "=" * 60)
        print("❌ Test FAILED")
        print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_forecast())
