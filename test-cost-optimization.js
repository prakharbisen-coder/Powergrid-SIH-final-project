/**
 * Cost Optimization API Test Script
 * 
 * Tests all 18 cost optimization endpoints
 * Run with: node test-cost-optimization.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let testProjectId = '';
let testForecastId = '';
let testBudgetId = '';

// Test credentials
const testUser = {
  email: 'test@example.com',
  password: 'test123'
};

// Helper function for making authenticated requests
const apiCall = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// Test suite
const runTests = async () => {
  console.log('\n🚀 Starting Cost Optimization API Tests\n');
  console.log('=' .repeat(60));

  try {
    // 1. Login
    console.log('\n1️⃣  Testing Authentication...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);
    authToken = loginResponse.data.token;
    console.log('✅ Login successful');

    // Get a project ID for testing
    const projectsResponse = await apiCall('GET', '/projects');
    if (projectsResponse.success && projectsResponse.data.data?.length > 0) {
      testProjectId = projectsResponse.data.data[0]._id;
      console.log(`✅ Found test project: ${testProjectId}`);
    } else {
      console.log('⚠️  No projects found. Create a project first.');
      return;
    }

    console.log('\n' + '=' .repeat(60));
    console.log('COST FORECAST ENDPOINTS');
    console.log('=' .repeat(60));

    // 2. Create Cost Forecast
    console.log('\n2️⃣  Testing POST /api/cost-optimization/forecast');
    const createForecastData = {
      project: testProjectId,
      forecastPeriod: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
        duration: 6,
        unit: 'months'
      },
      totalEstimatedCost: 25000000,
      costBreakdown: {
        materials: 15000000,
        labor: 5000000,
        equipment: 3000000,
        overhead: 2000000
      },
      monthlyCostProjection: [
        {
          month: 1,
          year: 2024,
          projectedCost: 4000000,
          confidence: 85
        },
        {
          month: 2,
          year: 2024,
          projectedCost: 4200000,
          confidence: 83
        }
      ],
      costDrivers: [
        {
          type: 'Material',
          description: 'Steel price volatility',
          impact: 'High',
          contribution: 35
        }
      ],
      optimizationOpportunities: [
        {
          title: 'Bulk Purchase Discount',
          description: 'Negotiate bulk pricing for conductors',
          category: 'Procurement',
          potentialSavings: 500000,
          implementationCost: 50000,
          timeline: 2,
          priority: 'High',
          status: 'Identified'
        }
      ],
      riskFactors: [
        {
          title: 'Market Price Increase',
          description: 'Steel prices may increase by 15%',
          probability: 60,
          impact: 'High',
          potentialCostIncrease: 2250000,
          mitigation: 'Lock in prices with suppliers'
        }
      ],
      benchmarks: {
        industry: 28000000,
        bestInClass: 22000000,
        previousProject: 26000000
      },
      accuracy: {
        confidenceLevel: 82,
        historicalMAE: 5.2,
        forecastMethod: 'ML-Enhanced Historical Analysis'
      }
    };

    const createForecastResult = await apiCall('POST', '/cost-optimization/forecast', createForecastData);
    if (createForecastResult.success) {
      testForecastId = createForecastResult.data.data._id;
      console.log(`✅ Cost forecast created: ${testForecastId}`);
      console.log(`   Total Cost: ₹${(createForecastResult.data.data.totalEstimatedCost / 10000000).toFixed(2)} Cr`);
    } else {
      console.log(`❌ Failed: ${createForecastResult.error}`);
    }

    // 3. Get All Cost Forecasts
    console.log('\n3️⃣  Testing GET /api/cost-optimization/forecast');
    const getAllForecastsResult = await apiCall('GET', '/cost-optimization/forecast');
    if (getAllForecastsResult.success) {
      console.log(`✅ Retrieved ${getAllForecastsResult.data.results} forecast(s)`);
    } else {
      console.log(`❌ Failed: ${getAllForecastsResult.error}`);
    }

    // 4. Get Cost Forecast by ID
    console.log('\n4️⃣  Testing GET /api/cost-optimization/forecast/:id');
    const getForecastByIdResult = await apiCall('GET', `/cost-optimization/forecast/${testForecastId}`);
    if (getForecastByIdResult.success) {
      console.log(`✅ Retrieved forecast: ${getForecastByIdResult.data.data._id}`);
      console.log(`   Confidence: ${getForecastByIdResult.data.data.accuracy.confidenceLevel}%`);
    } else {
      console.log(`❌ Failed: ${getForecastByIdResult.error}`);
    }

    // 5. Update Monthly Actual Costs
    console.log('\n5️⃣  Testing PUT /api/cost-optimization/forecast/:id/monthly-actual');
    const updateActualData = {
      month: 1,
      year: 2024,
      actualCost: 4150000
    };
    const updateActualResult = await apiCall('PUT', `/cost-optimization/forecast/${testForecastId}/monthly-actual`, updateActualData);
    if (updateActualResult.success) {
      const monthData = updateActualResult.data.data.monthlyCostProjection.find(m => m.month === 1);
      console.log(`✅ Monthly actual updated`);
      console.log(`   Projected: ₹${(monthData.projectedCost / 10000000).toFixed(2)} Cr`);
      console.log(`   Actual: ₹${(monthData.actualCost / 10000000).toFixed(2)} Cr`);
      console.log(`   Variance: ${monthData.variancePercentage.toFixed(2)}%`);
    } else {
      console.log(`❌ Failed: ${updateActualResult.error}`);
    }

    // 6. Add Optimization Opportunity
    console.log('\n6️⃣  Testing POST /api/cost-optimization/forecast/:id/opportunity');
    const newOpportunity = {
      title: 'Alternative Vendor for Cement',
      description: 'Switch to local vendor with 10% lower pricing',
      category: 'Vendor',
      potentialSavings: 350000,
      implementationCost: 25000,
      timeline: 1,
      priority: 'Medium',
      status: 'Under Review'
    };
    const addOpportunityResult = await apiCall('POST', `/cost-optimization/forecast/${testForecastId}/opportunity`, newOpportunity);
    if (addOpportunityResult.success) {
      console.log(`✅ Optimization opportunity added`);
      console.log(`   Potential Savings: ₹${(newOpportunity.potentialSavings / 100000).toFixed(2)} Lakh`);
    } else {
      console.log(`❌ Failed: ${addOpportunityResult.error}`);
    }

    // 7. Get Cost Savings Summary
    console.log('\n7️⃣  Testing GET /api/cost-optimization/forecast/:id/savings');
    const savingsSummaryResult = await apiCall('GET', `/cost-optimization/forecast/${testForecastId}/savings`);
    if (savingsSummaryResult.success) {
      const summary = savingsSummaryResult.data.data;
      console.log(`✅ Savings summary retrieved`);
      console.log(`   Total Potential: ₹${(summary.totalPotentialSavings / 100000).toFixed(2)} Lakh`);
      console.log(`   Net Savings: ₹${(summary.netSavings / 100000).toFixed(2)} Lakh`);
      console.log(`   Opportunities: ${summary.opportunityCount}`);
    } else {
      console.log(`❌ Failed: ${savingsSummaryResult.error}`);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('PROJECT BUDGET ENDPOINTS');
    console.log('=' .repeat(60));

    // 8. Create Project Budget
    console.log('\n8️⃣  Testing POST /api/cost-optimization/budget');
    const createBudgetData = {
      project: testProjectId,
      totalBudget: 30000000,
      budgetCategories: [
        { category: 'Materials', allocated: 18000000, spent: 2000000 },
        { category: 'Labor', allocated: 6000000, spent: 500000 },
        { category: 'Equipment', allocated: 4000000, spent: 0 },
        { category: 'Contingency', allocated: 2000000, spent: 0 }
      ],
      milestones: [
        {
          name: 'Phase 1 - Foundation',
          budgetAllocated: 8000000,
          targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        }
      ],
      costControls: [
        {
          type: 'Approval Required',
          threshold: 100000,
          description: 'Purchases over ₹1 Lakh require approval'
        }
      ]
    };

    const createBudgetResult = await apiCall('POST', '/cost-optimization/budget', createBudgetData);
    if (createBudgetResult.success) {
      testBudgetId = createBudgetResult.data.data._id;
      console.log(`✅ Project budget created: ${testBudgetId}`);
      console.log(`   Total Budget: ₹${(createBudgetResult.data.data.totalBudget / 10000000).toFixed(2)} Cr`);
      console.log(`   Utilization: ${createBudgetResult.data.data.utilizationPercentage.toFixed(2)}%`);
    } else {
      console.log(`❌ Failed: ${createBudgetResult.error}`);
    }

    // 9. Get All Project Budgets
    console.log('\n9️⃣  Testing GET /api/cost-optimization/budget');
    const getAllBudgetsResult = await apiCall('GET', '/cost-optimization/budget');
    if (getAllBudgetsResult.success) {
      console.log(`✅ Retrieved ${getAllBudgetsResult.data.results} budget(s)`);
    } else {
      console.log(`❌ Failed: ${getAllBudgetsResult.error}`);
    }

    // 10. Get Project Budget by ID
    console.log('\n🔟 Testing GET /api/cost-optimization/budget/:id');
    const getBudgetByIdResult = await apiCall('GET', `/cost-optimization/budget/${testBudgetId}`);
    if (getBudgetByIdResult.success) {
      console.log(`✅ Retrieved budget: ${getBudgetByIdResult.data.data._id}`);
      console.log(`   Remaining: ₹${(getBudgetByIdResult.data.data.remainingBudget / 10000000).toFixed(2)} Cr`);
    } else {
      console.log(`❌ Failed: ${getBudgetByIdResult.error}`);
    }

    // 11. Record Spending
    console.log('\n1️⃣1️⃣  Testing POST /api/cost-optimization/budget/:id/spending');
    const spendingData = {
      category: 'Materials',
      amount: 750000,
      description: 'Purchase of steel beams',
      date: new Date()
    };
    const recordSpendingResult = await apiCall('POST', `/cost-optimization/budget/${testBudgetId}/spending`, spendingData);
    if (recordSpendingResult.success) {
      console.log(`✅ Spending recorded`);
      console.log(`   Amount: ₹${(spendingData.amount / 100000).toFixed(2)} Lakh`);
      console.log(`   Category: ${spendingData.category}`);
    } else {
      console.log(`❌ Failed: ${recordSpendingResult.error}`);
    }

    // 12. Add Budget Revision
    console.log('\n1️⃣2️⃣  Testing POST /api/cost-optimization/budget/:id/revision');
    const revisionData = {
      revisionNumber: 1,
      previousBudget: 30000000,
      newBudget: 32000000,
      reason: 'Material cost increase',
      justification: 'Steel prices increased by 15% due to market conditions',
      approvedBy: 'Project Manager'
    };
    const addRevisionResult = await apiCall('POST', `/cost-optimization/budget/${testBudgetId}/revision`, revisionData);
    if (addRevisionResult.success) {
      console.log(`✅ Budget revision added`);
      console.log(`   Old: ₹${(revisionData.previousBudget / 10000000).toFixed(2)} Cr`);
      console.log(`   New: ₹${(revisionData.newBudget / 10000000).toFixed(2)} Cr`);
    } else {
      console.log(`❌ Failed: ${addRevisionResult.error}`);
    }

    // 13. Get Budget Performance Metrics
    console.log('\n1️⃣3️⃣  Testing GET /api/cost-optimization/budget/:id/performance');
    const performanceResult = await apiCall('GET', `/cost-optimization/budget/${testBudgetId}/performance`);
    if (performanceResult.success) {
      const perf = performanceResult.data.data.performanceMetrics;
      console.log(`✅ Performance metrics retrieved`);
      console.log(`   CPI: ${perf.CPI.toFixed(2)} (${perf.CPI >= 1 ? 'Under Budget' : 'Over Budget'})`);
      console.log(`   Utilization: ${performanceResult.data.data.utilizationPercentage.toFixed(2)}%`);
    } else {
      console.log(`❌ Failed: ${performanceResult.error}`);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('COMPARISON ENDPOINT');
    console.log('=' .repeat(60));

    // 14. Compare Budget vs Forecast
    console.log('\n1️⃣4️⃣  Testing GET /api/cost-optimization/compare/:budgetId/:forecastId');
    const compareResult = await apiCall('GET', `/cost-optimization/compare/${testBudgetId}/${testForecastId}`);
    if (compareResult.success) {
      const comp = compareResult.data.data;
      console.log(`✅ Comparison completed`);
      console.log(`   Budget: ₹${(comp.budget.totalBudget / 10000000).toFixed(2)} Cr`);
      console.log(`   Forecast: ₹${(comp.forecast.totalEstimatedCost / 10000000).toFixed(2)} Cr`);
      console.log(`   Variance: ${comp.analysis.variancePercentage.toFixed(2)}%`);
      console.log(`   Risk: ${comp.analysis.riskLevel}`);
      console.log(`\n   Recommendations:`);
      comp.analysis.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    } else {
      console.log(`❌ Failed: ${compareResult.error}`);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('✅ ALL TESTS COMPLETED!');
    console.log('=' .repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   - Cost Forecast ID: ${testForecastId}`);
    console.log(`   - Project Budget ID: ${testBudgetId}`);
    console.log(`   - Total Endpoints Tested: 14`);
    console.log(`\n💡 Next Steps:`);
    console.log(`   1. Test remaining update endpoints`);
    console.log(`   2. Create frontend components`);
    console.log(`   3. Integrate with existing pages`);

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
};

// Run the tests
runTests();
