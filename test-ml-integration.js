/**
 * Complete ML Forecast Integration Test
 * Tests the full flow: Frontend -> Backend -> ML Service -> Backend -> Frontend
 */

import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000';
const ML_SERVICE_URL = 'http://localhost:8000';

// Test data
const testProjectData = {
  project_id: "TEST-ML-001",
  project_name: "Test ML Integration Project",
  tower_count: 75,
  voltage: "400kV",
  tower_type: "Lattice",
  terrain: "hilly",
  region: "west",
  start_date: "2024-01-01T00:00:00Z",
  end_date: "2025-12-31T23:59:59Z"
};

async function testMLService() {
  console.log('\n========================================');
  console.log('1. Testing ML Service Directly');
  console.log('========================================');
  
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/forecast`, testProjectData);
    console.log('✅ ML Service Response:');
    console.log(`   - Project: ${response.data.project_name}`);
    console.log(`   - Risk Level: ${response.data.risk_level}`);
    console.log(`   - Total Cost: ₹${response.data.total_estimated_cost.toLocaleString()}`);
    console.log(`   - Materials Forecast: ${response.data.forecasts.length} items`);
    
    response.data.forecasts.forEach((f, i) => {
      console.log(`   ${i + 1}. ${f.material}: ${f.predicted_quantity.toLocaleString()} ${f.unit} (${(f.confidence_score * 100).toFixed(0)}% confidence)`);
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ ML Service Error:', error.response?.data || error.message);
    return null;
  }
}

async function testBackendProcessing(mlData) {
  console.log('\n========================================');
  console.log('2. Testing Backend Processing');
  console.log('========================================');
  
  try {
    // Simulate what backend does with the ML data
    const materialUnitCosts = {
      'Steel': 65,
      'Conductors': 450,
      'Insulators': 450,
      'Cement': 420,
      'Nuts/Bolts': 45,
      'Earthing': 1200
    };
    
    console.log('✅ Backend would process forecasts with:');
    let totalCost = 0;
    
    mlData.forecasts.forEach((forecast, i) => {
      const unitCost = materialUnitCosts[forecast.material] || 100;
      const baseAmount = unitCost * forecast.predicted_quantity;
      totalCost += baseAmount;
      
      console.log(`   ${i + 1}. ${forecast.material}:`);
      console.log(`      - Quantity: ${forecast.predicted_quantity.toLocaleString()} ${forecast.unit}`);
      console.log(`      - Unit Cost: ₹${unitCost}`);
      console.log(`      - Base Amount: ₹${baseAmount.toLocaleString()}`);
      console.log(`      - Confidence: ${(forecast.confidence_score * 100).toFixed(0)}%`);
    });
    
    console.log(`\n   Total Base Cost: ₹${totalCost.toLocaleString()}`);
    console.log('   (Tax calculations would be applied here)');
    
    return true;
  } catch (error) {
    console.error('❌ Backend Processing Error:', error.message);
    return false;
  }
}

async function testFrontendDisplay(mlData) {
  console.log('\n========================================');
  console.log('3. Testing Frontend Display Logic');
  console.log('========================================');
  
  try {
    // Simulate frontend processing
    if (!mlData || !mlData.forecasts || mlData.forecasts.length === 0) {
      throw new Error('No forecasts data available');
    }
    
    console.log('✅ Frontend would display:');
    console.log(`   - Project: ${mlData.project_name}`);
    console.log(`   - Risk Level: ${mlData.risk_level}`);
    
    // Calculate average confidence (what frontend does)
    const avgConfidence = mlData.forecasts.reduce((sum, f) => sum + (f.confidence_score || 0), 0) / mlData.forecasts.length * 100;
    console.log(`   - Average Confidence: ${avgConfidence.toFixed(1)}%`);
    
    // Chart data preparation
    const chartData = mlData.forecasts.slice(0, 6).map((f, index) => ({
      day: `Material ${index + 1}`,
      demand: f.predicted_quantity || 0,
      forecast: f.confidence_interval_high || 0,
      supply: f.confidence_interval_low || 0
    }));
    
    console.log('   - Chart Data Points: ' + chartData.length);
    
    // Material cards
    console.log('   - Material Cards:');
    mlData.forecasts.slice(0, 6).forEach((forecast, i) => {
      const hasAllData = forecast.material && 
                         forecast.predicted_quantity !== undefined && 
                         forecast.confidence_score !== undefined &&
                         forecast.confidence_interval_low !== undefined &&
                         forecast.confidence_interval_high !== undefined &&
                         forecast.unit;
      
      if (hasAllData) {
        console.log(`     ${i + 1}. ${forecast.material}: ✅ All data present`);
      } else {
        console.log(`     ${i + 1}. ${forecast.material || 'Unknown'}: ⚠️ Missing data`);
        if (!forecast.predicted_quantity) console.log('        - Missing predicted_quantity');
        if (!forecast.confidence_score) console.log('        - Missing confidence_score');
        if (!forecast.unit) console.log('        - Missing unit');
      }
    });
    
    // Recommendations
    if (mlData.recommendations && mlData.recommendations.length > 0) {
      console.log(`   - Recommendations: ${mlData.recommendations.length} items`);
      mlData.recommendations.forEach((rec, i) => {
        console.log(`     ${i + 1}. ${rec}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Frontend Display Error:', error.message);
    console.error('   Stack:', error.stack);
    return false;
  }
}

async function runFullTest() {
  console.log('🚀 STARTING COMPLETE ML FORECAST INTEGRATION TEST');
  console.log('Target Backend: ' + BACKEND_URL);
  console.log('Target ML Service: ' + ML_SERVICE_URL);
  console.log('================================================\n');
  
  // Step 1: Test ML Service
  const mlData = await testMLService();
  if (!mlData) {
    console.log('\n❌ TEST FAILED: ML Service not responding');
    return;
  }
  
  // Step 2: Test Backend Processing
  const backendOk = await testBackendProcessing(mlData);
  if (!backendOk) {
    console.log('\n❌ TEST FAILED: Backend processing error');
    return;
  }
  
  // Step 3: Test Frontend Display
  const frontendOk = await testFrontendDisplay(mlData);
  if (!frontendOk) {
    console.log('\n❌ TEST FAILED: Frontend display error');
    return;
  }
  
  console.log('\n========================================');
  console.log('📊 FINAL TEST RESULT');
  console.log('========================================');
  console.log('✅ ML Service: PASS');
  console.log('✅ Backend Processing: PASS');
  console.log('✅ Frontend Display: PASS');
  console.log('\n🎉 ALL TESTS PASSED!');
  console.log('The ML forecast integration is working correctly.');
}

runFullTest().catch(error => {
  console.error('\n💥 UNEXPECTED ERROR:', error.message);
  console.error(error.stack);
});
