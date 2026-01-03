// Test script for ML service endpoints
import axios from 'axios';

const ML_BASE_URL = 'http://localhost:8000';

// Test 1: Model Status
async function testModelStatus() {
  console.log('\n========================================');
  console.log('Test 1: Testing /forecast/model-status');
  console.log('========================================');
  try {
    const response = await axios.get(`${ML_BASE_URL}/forecast/model-status`);
    console.log('✅ Model Status Response:');
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Model Status Error:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Scenario Simulation
async function testScenario() {
  console.log('\n========================================');
  console.log('Test 2: Testing /api/scenario/run');
  console.log('========================================');
  try {
    const scenarioData = {
      project_id: "P001",
      region_id: "R001",
      horizon_months: 6,
      demand_change_percent: 10.0,
      cost_change_percent: 5.0
    };
    console.log('Request Data:', JSON.stringify(scenarioData, null, 2));
    
    const response = await axios.post(`${ML_BASE_URL}/api/scenario/run`, scenarioData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Scenario Response:');
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Scenario Error:', error.response?.data || error.message);
    return false;
  }
}

// Test 3: Forecast
async function testForecast() {
  console.log('\n========================================');
  console.log('Test 3: Testing /forecast');
  console.log('========================================');
  try {
    const forecastData = {
      project_id: "TEST-001",
      project_name: "Test Transmission Project",
      tower_count: 100,
      voltage: "400kV",
      tower_type: "Lattice",
      terrain: "hilly",
      region: "west",
      start_date: "2024-01-01T00:00:00Z",
      end_date: "2025-12-31T23:59:59Z"
    };
    console.log('Request Data:', JSON.stringify(forecastData, null, 2));
    
    const response = await axios.post(`${ML_BASE_URL}/forecast`, forecastData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Forecast Response:');
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Forecast Error:', error.response?.data || error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting ML Service Tests...');
  console.log(`Target: ${ML_BASE_URL}`);
  
  const results = {
    modelStatus: await testModelStatus(),
    scenario: await testScenario(),
    forecast: await testForecast()
  };
  
  console.log('\n========================================');
  console.log('📊 TEST SUMMARY');
  console.log('========================================');
  console.log(`Model Status: ${results.modelStatus ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Scenario Simulation: ${results.scenario ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Forecast: ${results.forecast ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(r => r === true);
  console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
}

runTests().catch(console.error);
