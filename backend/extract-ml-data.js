/**
 * ML Data Extraction Script for Budget Optimization Models
 * 
 * Extracts data from MongoDB collections to create training datasets for:
 * 1. Cost Forecasting Model
 * 2. Project Budget Model
 * 
 * Output: CSV files that can be used to train ML models and create .pkl files
 * 
 * Usage: node extract-ml-data.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const Project = require('./models/Project');
const Budget = require('./models/Budget');
const Material = require('./models/Material');
const Forecast = require('./models/Forecast');
const Procurement = require('./models/Procurement');
const Analytics = require('./models/Analytics');
const CostForecast = require('./models/CostForecast');
const ProjectBudget = require('./models/ProjectBudget');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/powergrid', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Create output directory
const createOutputDir = () => {
  const outputDir = path.join(__dirname, 'ml-data-export');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  return outputDir;
};

// Convert array of objects to CSV
const arrayToCSV = (data, headers) => {
  if (!data || data.length === 0) return '';
  
  const csvRows = [];
  
  // Add header row
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Handle null/undefined
      if (value === null || value === undefined) return '';
      // Escape commas and quotes
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
};

// Save data to CSV
const saveToCSV = (filename, data, headers) => {
  const outputDir = createOutputDir();
  const filepath = path.join(outputDir, filename);
  const csv = arrayToCSV(data, headers);
  fs.writeFileSync(filepath, csv, 'utf8');
  console.log(`✅ Saved: ${filename} (${data.length} rows)`);
};

/**
 * DATASET 1: Cost Forecasting Training Data
 * Features for predicting project costs
 */
const extractCostForecastingData = async () => {
  console.log('\n📊 Extracting Cost Forecasting Data...');
  
  try {
    // Get all projects with their budgets and actual spending
    const projects = await Project.find({})
      .populate('materials.material')
      .lean();
    
    const costForecastData = [];
    
    for (const project of projects) {
      // Calculate project duration in days
      const startDate = new Date(project.timeline.startDate);
      const endDate = new Date(project.timeline.endDate);
      const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      
      // Calculate material costs
      let totalMaterialCost = 0;
      let materialCategories = {};
      
      if (project.materials && project.materials.length > 0) {
        for (const mat of project.materials) {
          if (mat.material && mat.material.price) {
            const matCost = mat.estimatedQuantity * mat.material.price;
            totalMaterialCost += matCost;
            
            const category = mat.material.category || 'Others';
            materialCategories[category] = (materialCategories[category] || 0) + matCost;
          }
        }
      }
      
      // Calculate cost per tower
      const costPerTower = project.infrastructure.towerCount > 0 
        ? project.budget.total / project.infrastructure.towerCount 
        : 0;
      
      // Calculate cost per km
      const costPerKm = project.infrastructure.lineLength?.value > 0
        ? project.budget.total / project.infrastructure.lineLength.value
        : 0;
      
      // Budget utilization
      const budgetUtilization = project.budget.total > 0
        ? (project.budget.spent / project.budget.total) * 100
        : 0;
      
      // Calculate variance
      const budgetVariance = project.budget.allocated > 0
        ? ((project.budget.spent - project.budget.allocated) / project.budget.allocated) * 100
        : 0;
      
      const record = {
        // Project identifiers
        project_id: project.projectId,
        project_name: project.name,
        
        // Location features
        region: project.location.region,
        state: project.location.state,
        terrain: project.location.terrain,
        
        // Infrastructure features
        tower_type: project.infrastructure.towerType,
        tower_count: project.infrastructure.towerCount,
        substation_type: project.infrastructure.substationType || 'None',
        substation_count: project.infrastructure.substationCount || 0,
        line_length_km: project.infrastructure.lineLength?.value || 0,
        voltage_level: project.infrastructure.voltage,
        
        // Timeline features
        duration_days: durationDays,
        project_status: project.timeline.status,
        
        // Cost features
        total_budget: project.budget.total,
        allocated_budget: project.budget.allocated,
        spent_budget: project.budget.spent,
        remaining_budget: project.budget.total - project.budget.spent,
        budget_utilization_percent: budgetUtilization.toFixed(2),
        budget_variance_percent: budgetVariance.toFixed(2),
        
        // Derived cost metrics
        cost_per_tower: costPerTower.toFixed(2),
        cost_per_km: costPerKm.toFixed(2),
        
        // Material cost breakdown
        total_material_cost: totalMaterialCost.toFixed(2),
        steel_cost: (materialCategories['Steel'] || 0).toFixed(2),
        conductor_cost: (materialCategories['Conductors'] || 0).toFixed(2),
        insulator_cost: (materialCategories['Insulators'] || 0).toFixed(2),
        cement_cost: (materialCategories['Cement'] || 0).toFixed(2),
        earthing_cost: (materialCategories['Earthing'] || 0).toFixed(2),
        other_material_cost: (materialCategories['Others'] || 0).toFixed(2),
        
        // Tax and additional costs
        gst_percent: project.costs.gst,
        transport_cost: project.costs.transportCost,
        state_taxes: project.costs.stateTaxes,
        custom_duty: project.costs.customDuty,
        other_charges: project.costs.otherCharges,
        
        // Weather and environmental factors
        avg_temperature: project.weather?.avgTemperature || 0,
        rainfall_level: project.weather?.rainfall || 'Medium',
        cyclone_prone: project.weather?.cycloneProne ? 1 : 0,
        
        // Contractor performance
        contractor_rating: project.contractor?.performanceRating || 0,
        
        // Status
        project_overall_status: project.status,
        financial_year: project.budget.financialYear,
        
        // Target variable for ML model
        actual_total_cost: project.budget.spent,
        cost_overrun: project.budget.spent > project.budget.total ? 1 : 0,
        cost_overrun_percent: project.budget.total > 0 
          ? ((project.budget.spent - project.budget.total) / project.budget.total * 100).toFixed(2)
          : 0
      };
      
      costForecastData.push(record);
    }
    
    // Save to CSV
    const headers = Object.keys(costForecastData[0] || {});
    saveToCSV('cost_forecasting_training_data.csv', costForecastData, headers);
    
    return costForecastData;
  } catch (error) {
    console.error('❌ Error extracting cost forecasting data:', error.message);
    return [];
  }
};

/**
 * DATASET 2: Project Budget Training Data
 * Features for budget allocation and management
 */
const extractProjectBudgetData = async () => {
  console.log('\n📊 Extracting Project Budget Data...');
  
  try {
    // Get all budgets with historical data
    const budgets = await Budget.find({}).lean();
    
    const budgetData = [];
    
    for (const budget of budgets) {
      // Calculate metrics
      const utilizationPercent = budget.allocated > 0
        ? (budget.spent / budget.allocated) * 100
        : 0;
      
      const remainingBudget = budget.allocated - budget.spent;
      const remainingPercent = budget.allocated > 0
        ? (remainingBudget / budget.allocated) * 100
        : 0;
      
      // Count transactions
      const totalTransactions = budget.transactions?.length || 0;
      const expenseCount = budget.transactions?.filter(t => t.type === 'expense').length || 0;
      const allocationCount = budget.transactions?.filter(t => t.type === 'allocation').length || 0;
      const transferCount = budget.transactions?.filter(t => t.type === 'transfer').length || 0;
      
      // Calculate average transaction amount
      const avgTransactionAmount = totalTransactions > 0
        ? budget.transactions.reduce((sum, t) => sum + (t.amount || 0), 0) / totalTransactions
        : 0;
      
      const record = {
        // Budget identifiers
        budget_id: budget._id.toString(),
        category: budget.category,
        fiscal_year: budget.fiscalYear,
        department: budget.department || 'General',
        
        // Budget amounts
        allocated_amount: budget.allocated,
        spent_amount: budget.spent,
        projected_amount: budget.projected || budget.allocated,
        remaining_amount: remainingBudget.toFixed(2),
        
        // Budget metrics
        utilization_percent: utilizationPercent.toFixed(2),
        remaining_percent: remainingPercent.toFixed(2),
        status: budget.status,
        
        // Transaction metrics
        total_transactions: totalTransactions,
        expense_count: expenseCount,
        allocation_count: allocationCount,
        transfer_count: transferCount,
        avg_transaction_amount: avgTransactionAmount.toFixed(2),
        
        // Status flags
        is_on_track: budget.status === 'on-track' ? 1 : 0,
        is_under_budget: budget.status === 'under-budget' ? 1 : 0,
        is_over_budget: budget.status === 'over-budget' ? 1 : 0,
        is_critical: budget.status === 'critical' ? 1 : 0,
        
        // Time features
        created_at: budget.createdAt,
        updated_at: budget.updatedAt,
        days_active: Math.ceil((new Date() - new Date(budget.createdAt)) / (1000 * 60 * 60 * 24)),
        
        // Target variables for ML model
        budget_exceeded: budget.spent > budget.allocated ? 1 : 0,
        overrun_amount: Math.max(0, budget.spent - budget.allocated),
        final_status: budget.status
      };
      
      budgetData.push(record);
    }
    
    // Save to CSV
    const headers = Object.keys(budgetData[0] || {});
    saveToCSV('project_budget_training_data.csv', budgetData, headers);
    
    return budgetData;
  } catch (error) {
    console.error('❌ Error extracting project budget data:', error.message);
    return [];
  }
};

/**
 * DATASET 3: Material Demand and Cost Data
 * Features for material cost forecasting
 */
const extractMaterialCostData = async () => {
  console.log('\n📊 Extracting Material Cost Data...');
  
  try {
    // Get all materials with price history
    const materials = await Material.find({}).lean();
    
    const materialData = [];
    
    for (const material of materials) {
      const record = {
        // Material identifiers
        material_id: material.materialId,
        material_name: material.name,
        category: material.category,
        sub_category: material.subCategory || 'General',
        
        // Inventory metrics
        current_quantity: material.quantity,
        threshold: material.threshold,
        reusable_quantity: material.reusable,
        status: material.status,
        
        // Cost metrics
        unit_price: material.price || 0,
        total_value: ((material.price || 0) * material.quantity).toFixed(2),
        
        // Location
        location: material.location,
        
        // Specifications (key features)
        grade: material.specifications?.grade || '',
        thickness: material.specifications?.thickness || 0,
        length: material.specifications?.length || 0,
        width: material.specifications?.width || 0,
        weight: material.specifications?.weight || 0,
        voltage_rating: material.specifications?.voltage_rating || '',
        conductor_size: material.specifications?.conductor_size || '',
        
        // Status flags
        is_optimal: material.status === 'optimal' ? 1 : 0,
        is_low: material.status === 'low' ? 1 : 0,
        is_critical: material.status === 'critical' ? 1 : 0,
        is_out_of_stock: material.status === 'out-of-stock' ? 1 : 0,
        
        // Supplier info
        supplier: material.supplier || 'Unknown',
        
        // Time features
        last_updated: material.lastUpdated,
        days_since_update: Math.ceil((new Date() - new Date(material.lastUpdated)) / (1000 * 60 * 60 * 24))
      };
      
      materialData.push(record);
    }
    
    // Save to CSV
    const headers = Object.keys(materialData[0] || {});
    saveToCSV('material_cost_data.csv', materialData, headers);
    
    return materialData;
  } catch (error) {
    console.error('❌ Error extracting material cost data:', error.message);
    return [];
  }
};

/**
 * DATASET 4: Procurement and Tax Data
 * Features for cost optimization including tax impact
 */
const extractProcurementData = async () => {
  console.log('\n📊 Extracting Procurement and Tax Data...');
  
  try {
    const procurements = await Procurement.find({})
      .populate('material')
      .lean();
    
    const procurementData = [];
    
    for (const proc of procurements) {
      const record = {
        // Procurement identifiers
        po_number: proc.poNumber,
        material_name: proc.material?.name || 'Unknown',
        material_category: proc.material?.category || 'Unknown',
        quantity: proc.quantity,
        
        // Vendor info
        vendor_name: proc.vendor.name,
        
        // Pricing
        unit_price: proc.pricing.unitPrice,
        total_amount: proc.pricing.totalAmount,
        discount: proc.pricing.discount || 0,
        final_amount: proc.pricing.finalAmount,
        
        // Location and logistics
        origin_state: proc.originState || '',
        delivery_state: proc.deliveryState || '',
        is_imported: proc.isImported ? 1 : 0,
        distance_km: proc.distance || 0,
        weight: proc.weight || 0,
        vehicle_type: proc.vehicleType,
        
        // Tax breakdown
        custom_duty_rate: proc.taxBreakdown?.customDuty?.customDutyRate || 0,
        custom_duty_amount: proc.taxBreakdown?.customDuty?.customDutyAmount || 0,
        cgst: proc.taxBreakdown?.gst?.cgst || 0,
        sgst: proc.taxBreakdown?.gst?.sgst || 0,
        igst: proc.taxBreakdown?.gst?.igst || 0,
        total_gst: proc.taxBreakdown?.gst?.totalGST || 0,
        state_cess: proc.taxBreakdown?.stateTaxes?.cess || 0,
        total_state_tax: proc.taxBreakdown?.stateTaxes?.totalStateTax || 0,
        transport_cost: proc.taxBreakdown?.transport?.totalCost || 0,
        
        // Cost summary
        subtotal: proc.costSummary?.subtotal || proc.pricing.totalAmount,
        total_taxes: proc.costSummary?.totalTaxes || 0,
        total_transport: proc.costSummary?.totalTransport || 0,
        grand_total: proc.costSummary?.grandTotal || proc.pricing.finalAmount,
        tax_percentage: proc.costSummary?.taxPercentage || 0,
        
        // Status
        status: proc.status,
        priority: proc.priority,
        
        // Dates
        order_date: proc.dates?.orderDate || '',
        expected_delivery: proc.dates?.expectedDelivery || '',
        actual_delivery: proc.dates?.actualDelivery || '',
        
        // Delivery performance
        delivery_delay_days: proc.dates?.expectedDelivery && proc.dates?.actualDelivery
          ? Math.ceil((new Date(proc.dates.actualDelivery) - new Date(proc.dates.expectedDelivery)) / (1000 * 60 * 60 * 24))
          : 0,
        is_delivered_on_time: proc.dates?.expectedDelivery && proc.dates?.actualDelivery
          ? (new Date(proc.dates.actualDelivery) <= new Date(proc.dates.expectedDelivery) ? 1 : 0)
          : null,
        
        // Status flags
        is_delivered: proc.status === 'delivered' ? 1 : 0,
        is_cancelled: proc.status === 'cancelled' ? 1 : 0,
        is_high_priority: proc.priority === 'high' || proc.priority === 'urgent' ? 1 : 0
      };
      
      procurementData.push(record);
    }
    
    // Save to CSV
    const headers = Object.keys(procurementData[0] || {});
    saveToCSV('procurement_tax_data.csv', procurementData, headers);
    
    return procurementData;
  } catch (error) {
    console.error('❌ Error extracting procurement data:', error.message);
    return [];
  }
};

/**
 * DATASET 5: Historical Forecast Data
 * Features for improving forecast accuracy
 */
const extractForecastData = async () => {
  console.log('\n📊 Extracting Historical Forecast Data...');
  
  try {
    const forecasts = await Forecast.find({}).lean();
    
    const forecastData = [];
    
    for (const forecast of forecasts) {
      // Calculate forecast accuracy metrics
      const accuracy = forecast.accuracy || 0;
      const variance = forecast.variance || 0;
      const hasMLPredictions = forecast.mlPredictions && forecast.mlPredictions.length > 0;
      
      // Tax impact metrics
      const avgTaxPercentage = forecast.taxSummary?.averageTaxPercentage || 0;
      const totalTaxAmount = forecast.taxSummary?.totalTaxAmount || 0;
      
      const record = {
        // Forecast identifiers
        forecast_id: forecast._id.toString(),
        project: forecast.project,
        material: forecast.material,
        duration_days: forecast.duration,
        
        // Predictions
        predicted_quantity: forecast.predictedQuantity,
        actual_quantity: forecast.actualQuantity,
        variance: variance,
        variance_percent: forecast.predictedQuantity > 0 
          ? ((variance / forecast.predictedQuantity) * 100).toFixed(2)
          : 0,
        
        // Accuracy metrics
        accuracy_percent: accuracy,
        confidence_score: forecast.confidence || 0,
        risk_level: forecast.riskLevel || 'Medium',
        
        // ML predictions count
        ml_predictions_count: forecast.mlPredictions?.length || 0,
        has_ml_predictions: hasMLPredictions ? 1 : 0,
        
        // Tax metrics
        total_base_amount: forecast.taxSummary?.totalBaseAmount || 0,
        total_tax_amount: totalTaxAmount,
        total_cost_with_tax: forecast.taxSummary?.totalCostWithTax || 0,
        avg_tax_percentage: avgTaxPercentage,
        
        // Insights count
        total_insights: forecast.insights?.length || 0,
        high_severity_insights: forecast.insights?.filter(i => i.severity === 'high').length || 0,
        
        // Status
        status: forecast.status,
        
        // Time features
        created_at: forecast.createdAt,
        forecast_period_start: forecast.period?.start || '',
        forecast_period_end: forecast.period?.end || '',
        
        // Target variables
        forecast_accuracy_category: accuracy >= 90 ? 'Excellent' : accuracy >= 75 ? 'Good' : accuracy >= 60 ? 'Fair' : 'Poor',
        is_accurate: accuracy >= 80 ? 1 : 0,
        has_high_variance: Math.abs(variance) > (forecast.predictedQuantity * 0.1) ? 1 : 0
      };
      
      forecastData.push(record);
    }
    
    // Save to CSV
    if (forecastData.length > 0) {
      const headers = Object.keys(forecastData[0]);
      saveToCSV('historical_forecast_data.csv', forecastData, headers);
    }
    
    return forecastData;
  } catch (error) {
    console.error('❌ Error extracting forecast data:', error.message);
    return [];
  }
};

/**
 * DATASET 6: Analytics and Performance Data
 */
const extractAnalyticsData = async () => {
  console.log('\n📊 Extracting Analytics and Performance Data...');
  
  try {
    const analytics = await Analytics.find({}).lean();
    
    const analyticsData = [];
    
    for (const analytic of analytics) {
      const record = {
        // Analytics identifiers
        analytics_id: analytic._id.toString(),
        region: analytic.region,
        period_start: analytic.period.startDate,
        period_end: analytic.period.endDate,
        
        // Metrics
        demand: analytic.metrics?.demand || 0,
        fulfillment: analytic.metrics?.fulfillment || 0,
        efficiency: analytic.metrics?.efficiency || 0,
        cost_per_unit: analytic.metrics?.costPerUnit || 0,
        avg_delivery_time: analytic.metrics?.averageDeliveryTime || 0,
        
        // Budget analysis
        budget_allocated: analytic.budgetAnalysis?.allocated || 0,
        budget_spent: analytic.budgetAnalysis?.spent || 0,
        budget_variance: analytic.budgetAnalysis?.variance || 0,
        budget_utilization_percent: analytic.budgetAnalysis?.utilizationPercent || 0,
        
        // Performance indicators
        on_time_delivery_percent: analytic.performanceIndicators?.onTimeDelivery || 0,
        stock_accuracy_percent: analytic.performanceIndicators?.stockAccuracy || 0,
        forecast_accuracy_percent: analytic.performanceIndicators?.forecastAccuracy || 0,
        supplier_performance_score: analytic.performanceIndicators?.supplierPerformance || 0,
        
        // Material breakdown count
        material_types_count: analytic.materialBreakdown?.length || 0,
        trends_count: analytic.trends?.length || 0,
        
        // Time features
        created_at: analytic.createdAt
      };
      
      analyticsData.push(record);
    }
    
    // Save to CSV
    if (analyticsData.length > 0) {
      const headers = Object.keys(analyticsData[0]);
      saveToCSV('analytics_performance_data.csv', analyticsData, headers);
    }
    
    return analyticsData;
  } catch (error) {
    console.error('❌ Error extracting analytics data:', error.message);
    return [];
  }
};

/**
 * Main extraction function
 */
const extractAllData = async () => {
  console.log('\n🚀 Starting ML Data Extraction...');
  console.log('=' .repeat(60));
  
  try {
    await connectDB();
    
    // Extract all datasets
    const costForecastData = await extractCostForecastingData();
    const budgetData = await extractProjectBudgetData();
    const materialData = await extractMaterialCostData();
    const procurementData = await extractProcurementData();
    const forecastData = await extractForecastData();
    const analyticsData = await extractAnalyticsData();
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('✅ Data Extraction Complete!');
    console.log('=' .repeat(60));
    console.log('\n📁 Files created in: backend/ml-data-export/');
    console.log(`\n📊 Summary:`);
    console.log(`   1. cost_forecasting_training_data.csv - ${costForecastData.length} records`);
    console.log(`   2. project_budget_training_data.csv - ${budgetData.length} records`);
    console.log(`   3. material_cost_data.csv - ${materialData.length} records`);
    console.log(`   4. procurement_tax_data.csv - ${procurementData.length} records`);
    console.log(`   5. historical_forecast_data.csv - ${forecastData.length} records`);
    console.log(`   6. analytics_performance_data.csv - ${analyticsData.length} records`);
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Copy CSV files to ml-service folder');
    console.log('   2. Run Python script to train models and create .pkl files');
    console.log('   3. Use trained models for budget optimization predictions\n');
    
    // Create README
    const readme = `# ML Training Data Export

## Generated: ${new Date().toISOString()}

## Datasets Created:

### 1. Cost Forecasting Training Data (${costForecastData.length} records)
**File:** cost_forecasting_training_data.csv
**Purpose:** Train ML model to predict project costs based on infrastructure, location, and historical data
**Features:** ${costForecastData.length > 0 ? Object.keys(costForecastData[0]).length : 0} columns
**Target Variables:** actual_total_cost, cost_overrun, cost_overrun_percent

### 2. Project Budget Training Data (${budgetData.length} records)
**File:** project_budget_training_data.csv
**Purpose:** Train ML model for budget allocation and management
**Features:** ${budgetData.length > 0 ? Object.keys(budgetData[0]).length : 0} columns
**Target Variables:** budget_exceeded, overrun_amount, final_status

### 3. Material Cost Data (${materialData.length} records)
**File:** material_cost_data.csv
**Purpose:** Track material prices and inventory for cost optimization
**Features:** ${materialData.length > 0 ? Object.keys(materialData[0]).length : 0} columns

### 4. Procurement Tax Data (${procurementData.length} records)
**File:** procurement_tax_data.csv
**Purpose:** Analyze tax impact on procurement costs
**Features:** ${procurementData.length > 0 ? Object.keys(procurementData[0]).length : 0} columns

### 5. Historical Forecast Data (${forecastData.length} records)
**File:** historical_forecast_data.csv
**Purpose:** Improve forecast accuracy using historical predictions
**Features:** ${forecastData.length > 0 ? Object.keys(forecastData[0]).length : 0} columns

### 6. Analytics Performance Data (${analyticsData.length} records)
**File:** analytics_performance_data.csv
**Purpose:** Track performance metrics for optimization
**Features:** ${analyticsData.length > 0 ? Object.keys(analyticsData[0]).length : 0} columns

## Usage:

\`\`\`bash
# Train models using Python
cd ml-service
python train_budget_models.py
\`\`\`

This will create:
- cost_forecasting_model.pkl
- project_budget_model.pkl
- encoders.pkl (for categorical features)
- scaler.pkl (for numerical features)
`;
    
    const outputDir = createOutputDir();
    fs.writeFileSync(path.join(outputDir, 'README.md'), readme, 'utf8');
    console.log('📄 Created README.md with dataset documentation\n');
    
  } catch (error) {
    console.error('\n❌ Extraction failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('👋 MongoDB connection closed');
  }
};

// Run extraction
extractAllData();
