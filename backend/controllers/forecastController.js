const Forecast = require('../models/Forecast');
const axios = require('axios');
const taxService = require('../services/taxService');
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// @desc    Get all forecasts
// @route   GET /api/forecasting
// @access  Private
exports.getForecasts = async (req, res) => {
  try {
    const { project, material, status } = req.query;
    
    let query = {};
    
    if (project) query.project = new RegExp(project, 'i');
    if (material) query.material = new RegExp(material, 'i');
    if (status) query.status = status;

    const forecasts = await Forecast.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: forecasts.length,
      data: forecasts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single forecast
// @route   GET /api/forecasting/:id
// @access  Private
exports.getForecast = async (req, res) => {
  try {
    const forecast = await Forecast.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!forecast) {
      return res.status(404).json({
        success: false,
        message: 'Forecast not found'
      });
    }

    res.status(200).json({
      success: true,
      data: forecast
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create forecast
// @route   POST /api/forecasting
// @access  Private
exports.createForecast = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    
    const forecast = await Forecast.create(req.body);

    res.status(201).json({
      success: true,
      data: forecast
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update forecast
// @route   PUT /api/forecasting/:id
// @access  Private
exports.updateForecast = async (req, res) => {
  try {
    const forecast = await Forecast.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!forecast) {
      return res.status(404).json({
        success: false,
        message: 'Forecast not found'
      });
    }

    res.status(200).json({
      success: true,
      data: forecast
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete forecast
// @route   DELETE /api/forecasting/:id
// @access  Private
exports.deleteForecast = async (req, res) => {
  try {
    const forecast = await Forecast.findByIdAndDelete(req.params.id);

    if (!forecast) {
      return res.status(404).json({
        success: false,
        message: 'Forecast not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Generate ML-based forecast for a project
// @route   POST /api/forecasting/generate
// @access  Private
exports.generateMLForecast = async (req, res) => {
  try {
    const Project = require('../models/Project');
    const BOQ = require('../models/BOQ');
    const project = await Project.findById(req.body.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Fetch BOQ data for the project if available
    const boq = await BOQ.findOne({ project: req.body.projectId });
    let boqData = null;
    
    if (boq && boq.items && boq.items.length > 0) {
      // Aggregate BOQ data by category
      const categoryAggregation = {};
      boq.items.forEach(item => {
        if (!categoryAggregation[item.category]) {
          categoryAggregation[item.category] = {
            totalQuantity: 0,
            consumedQuantity: 0,
            remainingQuantity: 0,
            unit: item.unit
          };
        }
        categoryAggregation[item.category].totalQuantity += item.boqQuantity;
        categoryAggregation[item.category].consumedQuantity += item.consumedQuantity;
        categoryAggregation[item.category].remainingQuantity += (item.boqQuantity - item.consumedQuantity);
      });
      
      boqData = {
        hasBoq: true,
        categories: categoryAggregation,
        totalItems: boq.items.length,
        overallProgress: boq.items.length > 0 ? 
          (boq.items.reduce((sum, item) => sum + item.consumedQuantity, 0) / 
           boq.items.reduce((sum, item) => sum + item.boqQuantity, 0) * 100).toFixed(2) : 0
      };
    }

    // Prepare data for ML service
    const forecastInput = {
      project_id: project._id.toString(),
      project_name: project.name,
      tower_count: project.infrastructure.towerCount,
      voltage: project.infrastructure.voltage,
      tower_type: project.infrastructure.towerType,
      terrain: project.location.terrain,
      region: project.location.region,
      start_date: project.timeline.startDate,
      end_date: project.timeline.endDate,
      boq_data: boqData // Include BOQ data in forecast request
    };

    // Call ML service
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/forecast`, forecastInput);
    const mlForecast = mlResponse.data;

    // Calculate duration in days
    const startDate = new Date(project.timeline.startDate);
    const endDate = new Date(project.timeline.endDate);
    const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    // Calculate taxes for each material forecast
    const forecastsWithTax = mlForecast.forecasts.map(materialForecast => {
      // Default unit costs for materials (in INR)
      const materialUnitCosts = {
        'Steel': 65,
        'Conductors': 450,
        'Insulators': 450,
        'Cement': 420,
        'Nuts/Bolts': 45,
        'Earthing': 1200
      };
      
      const unitCost = materialUnitCosts[materialForecast.material] || 100;
      const baseAmount = unitCost * materialForecast.predicted_quantity;
      
      const taxCalc = taxService.calculateTotalCost({
        basePrice: baseAmount,
        material: materialForecast.material || 'Steel',
        quantity: materialForecast.predicted_quantity,
        originState: req.body.originState || project.location.state || 'Delhi',
        destState: project.location.state || 'Delhi',
        isImported: req.body.isImported || false,
        distance: req.body.distance || 100, // Default 100km
        weight: materialForecast.predicted_quantity,
        vehicleType: 'standard',
        additionalCharges: 0
      });

      return {
        ...materialForecast,
        unit_cost: unitCost,
        base_amount: baseAmount,
        taxBreakdown: taxCalc.breakdown,
        costWithTax: taxCalc.summary.grandTotal,
        taxImpact: taxCalc.summary.totalTaxes,
        taxPercentage: taxCalc.summary.taxPercentage
      };
    });

    // Calculate total cost including taxes
    const totalCostWithTax = forecastsWithTax.reduce((sum, f) => sum + f.costWithTax, 0);
    const totalTaxAmount = forecastsWithTax.reduce((sum, f) => sum + f.taxImpact, 0);

    // Save forecast to database
    const forecast = await Forecast.create({
      project: project.name,
      material: 'All Materials',
      duration: durationDays,
      predictedQuantity: mlForecast.total_estimated_cost / 1000, // Simplified
      actualQuantity: 0,
      variance: 0,
      status: 'active',
      period: {
        start: project.timeline.startDate,
        end: project.timeline.endDate
      },
      mlPredictions: forecastsWithTax,
      confidence: mlForecast.forecasts.reduce((sum, f) => sum + f.confidence_score, 0) / mlForecast.forecasts.length,
      riskLevel: mlForecast.risk_level,
      recommendations: [
        ...mlForecast.recommendations,
        `TAX OPTIMIZATION: Total tax impact ₹${(totalTaxAmount / 10000000).toFixed(2)} Cr on ₹${(totalCostWithTax / 10000000).toFixed(2)} Cr project - Review tax calculations and consider optimization strategies`
      ],
      taxSummary: {
        totalBaseAmount: mlForecast.total_estimated_cost,
        totalTaxAmount: totalTaxAmount,
        totalCostWithTax: totalCostWithTax,
        averageTaxPercentage: (totalTaxAmount / mlForecast.total_estimated_cost) * 100
      },
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: {
        forecast: forecast,
        mlAnalysis: mlForecast
      }
    });
  } catch (error) {
    console.error('ML Forecast Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.detail || error.message || 'Failed to generate ML forecast'
    });
  }
};

// @desc    Check ML forecasting service status
// @route   GET /api/forecasting/ml-status
// @access  Private
exports.checkMLForecastStatus = async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/forecast/model-status`);
    res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'ML forecasting service unavailable',
      data: { ensemble_model_loaded: false }
    });
  }
};

// @desc    Generate ADVANCED ML-based forecast with BOQ validation
// @route   POST /api/forecasting/generate-advanced
// @access  Private
exports.generateAdvancedForecast = async (req, res) => {
  try {
    const { projectId, materialId, forecastDays = 30 } = req.body;
    
    const Project = require('../models/Project');
    const BOQ = require('../models/BOQ');
    const Material = require('../models/Material');
    
    // Fetch project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Fetch BOQ for project
    const boq = await BOQ.findOne({ project: projectId });
    if (!boq || !boq.items || boq.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'BOQ data not found for this project. Please add BOQ items first.'
      });
    }
    
    // Find specific material in BOQ
    const boqItem = boq.items.find(item => item.category === materialId || item.itemCode === materialId);
    if (!boqItem) {
      return res.status(400).json({
        success: false,
        message: `Material ${materialId} not found in BOQ`
      });
    }
    
    // Fetch historical consumption data (mock for now - you should have actual consumption records)
    // In production, fetch from a Consumption collection or similar
    const historicalData = [];
    const today = new Date();
    
    // Generate mock historical data for last 30 days based on consumed quantity
    const dailyAvg = boqItem.consumedQuantity / 30; // Rough average
    for (let i = 30; i > 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const consumed = dailyAvg * (0.8 + Math.random() * 0.4); // Add variance
      
      historicalData.push({
        date: date.toISOString().split('T')[0],
        material_id: materialId,
        consumed_quantity: consumed,
        cumulative_consumed: dailyAvg * (30 - i + 1)
      });
    }
    
    // Prepare BOQ data for ML service
    const boqData = [{
      material_id: materialId,
      material_name: boqItem.itemName || boqItem.category,
      boq_quantity: boqItem.boqQuantity,
      consumed_quantity: boqItem.consumedQuantity,
      unit: boqItem.unit
    }];
    
    // Prepare input for advanced ML service
    const advancedInput = {
      project_id: project._id.toString(),
      project_name: project.name,
      material_id: materialId,
      tower_count: project.infrastructure.towerCount,
      voltage: project.infrastructure.voltage,
      tower_type: project.infrastructure.towerType,
      terrain: project.location.terrain,
      region: project.location.region,
      start_date: new Date().toISOString().split('T')[0],
      end_date: project.timeline.endDate,
      forecast_days: forecastDays,
      historical_data: historicalData,
      boq_data: boqData,
      lead_time: req.body.lead_time || 7,
      season: req.body.season || null,
      temperature: req.body.temperature || null,
      price_index: req.body.price_index || 100,
      holidays: req.body.holidays || 0
    };
    
    console.log('🚀 Sending advanced forecast request to ML service...');
    
    // Call advanced ML service
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/forecast/advanced`, advancedInput);
    const advancedForecast = mlResponse.data;
    
    console.log('✅ Received advanced forecast from ML service');
    
    // Save forecast to database
    const forecastDoc = await Forecast.create({
      project: project.name,
      material: advancedForecast.material_name,
      duration: forecastDays,
      quantity: advancedForecast.summary.total_forecasted,
      unit: advancedForecast.summary.unit,
      confidence: 85, // Default confidence
      baseline: 0,
      optimistic: advancedForecast.summary.total_forecasted * 1.1,
      pessimistic: advancedForecast.summary.total_forecasted * 0.9,
      method: 'Advanced ML (Stacking Ensemble)',
      assumptions: [
        `Based on ${forecastDays} days forecast`,
        `BOQ remaining: ${advancedForecast.summary.final_remaining} ${advancedForecast.summary.unit}`,
        `Consumed: ${advancedForecast.summary.final_consumed_percentage.toFixed(2)}%`,
        `Alerts: ${advancedForecast.alerts.messages.join(', ')}`
      ],
      createdBy: req.user.id
    });
    
    // Return comprehensive response
    res.status(200).json({
      success: true,
      message: 'Advanced forecast generated successfully',
      data: {
        forecast_id: forecastDoc._id,
        project_id: advancedForecast.project_id,
        material_id: advancedForecast.material_id,
        material_name: advancedForecast.material_name,
        forecast_date: advancedForecast.forecast_date,
        daily_forecasts: advancedForecast.forecast,
        summary: advancedForecast.summary,
        alerts: advancedForecast.alerts,
        boq_status: {
          total_boq: advancedForecast.summary.total_boq_quantity,
          already_consumed: advancedForecast.summary.already_consumed,
          forecasted_consumption: advancedForecast.summary.total_forecasted,
          final_remaining: advancedForecast.summary.final_remaining,
          consumed_percentage: advancedForecast.summary.final_consumed_percentage,
          deficit: advancedForecast.summary.final_remaining < 0
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Advanced Forecast Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.detail || error.message || 'Failed to generate advanced forecast',
      error: error.response?.data || error.message
    });
  }
};
