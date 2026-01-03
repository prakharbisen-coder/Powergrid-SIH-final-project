const CostForecast = require('../models/CostForecast');
const ProjectBudget = require('../models/ProjectBudget');
const Project = require('../models/Project');
const asyncHandler = require('express-async-handler');

// @desc    Create cost forecast
// @route   POST /api/cost-optimization/forecast
// @access  Private
exports.createCostForecast = asyncHandler(async (req, res) => {
  const {
    project,
    forecastPeriod,
    totalEstimatedCost,
    costBreakdown,
    monthlyCostProjection,
    costDrivers,
    optimizationOpportunities,
    riskFactors
  } = req.body;

  const projectExists = await Project.findById(project);
  if (!projectExists) {
    res.status(404);
    throw new Error('Project not found');
  }

  const costForecast = await CostForecast.create({
    project,
    forecastPeriod,
    totalEstimatedCost,
    costBreakdown,
    monthlyCostProjection,
    costDrivers: costDrivers || [],
    optimizationOpportunities: optimizationOpportunities || [],
    riskFactors: riskFactors || [],
    createdBy: req.user._id,
    status: 'Draft'
  });

  res.status(201).json({
    success: true,
    data: costForecast
  });
});

// @desc    Get all cost forecasts
// @route   GET /api/cost-optimization/forecast
// @access  Private
exports.getCostForecasts = asyncHandler(async (req, res) => {
  const { project, status } = req.query;
  
  const filter = {};
  if (project) filter.project = project;
  if (status) filter.status = status;

  const costForecasts = await CostForecast.find(filter)
    .populate('project', 'name location')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: costForecasts.length,
    data: costForecasts
  });
});

// @desc    Get cost forecast by ID
// @route   GET /api/cost-optimization/forecast/:id
// @access  Private
exports.getCostForecastById = asyncHandler(async (req, res) => {
  const costForecast = await CostForecast.findById(req.params.id)
    .populate('project', 'name location infrastructure timeline')
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email');

  if (!costForecast) {
    res.status(404);
    throw new Error('Cost forecast not found');
  }

  res.status(200).json({
    success: true,
    data: costForecast
  });
});

// @desc    Update cost forecast
// @route   PUT /api/cost-optimization/forecast/:id
// @access  Private
exports.updateCostForecast = asyncHandler(async (req, res) => {
  let costForecast = await CostForecast.findById(req.params.id);

  if (!costForecast) {
    res.status(404);
    throw new Error('Cost forecast not found');
  }

  // Increment version on update
  req.body.version = (costForecast.version || 1) + 1;

  costForecast = await CostForecast.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: costForecast
  });
});

// @desc    Update monthly actual cost
// @route   PUT /api/cost-optimization/forecast/:id/monthly-actual
// @access  Private
exports.updateMonthlyActual = asyncHandler(async (req, res) => {
  const { month, year, actualCost } = req.body;

  const costForecast = await CostForecast.findById(req.params.id);

  if (!costForecast) {
    res.status(404);
    throw new Error('Cost forecast not found');
  }

  await costForecast.updateMonthlyVariance(month, year, actualCost);

  res.status(200).json({
    success: true,
    data: costForecast
  });
});

// @desc    Add optimization opportunity
// @route   POST /api/cost-optimization/forecast/:id/opportunity
// @access  Private
exports.addOptimizationOpportunity = asyncHandler(async (req, res) => {
  const costForecast = await CostForecast.findById(req.params.id);

  if (!costForecast) {
    res.status(404);
    throw new Error('Cost forecast not found');
  }

  costForecast.optimizationOpportunities.push(req.body);
  await costForecast.save();

  res.status(200).json({
    success: true,
    data: costForecast
  });
});

// @desc    Get cost savings summary
// @route   GET /api/cost-optimization/forecast/:id/savings
// @access  Private
exports.getCostSavingsSummary = asyncHandler(async (req, res) => {
  const costForecast = await CostForecast.findById(req.params.id);

  if (!costForecast) {
    res.status(404);
    throw new Error('Cost forecast not found');
  }

  const totalSavings = costForecast.calculateTotalSavings();
  const netSavings = costForecast.calculateNetSavings();
  const savingsPercentage = ((totalSavings / costForecast.totalEstimatedCost) * 100).toFixed(2);

  const opportunitiesByStatus = {
    identified: costForecast.optimizationOpportunities.filter(o => o.status === 'Identified').length,
    underReview: costForecast.optimizationOpportunities.filter(o => o.status === 'Under Review').length,
    approved: costForecast.optimizationOpportunities.filter(o => o.status === 'Approved').length,
    inProgress: costForecast.optimizationOpportunities.filter(o => o.status === 'In Progress').length,
    implemented: costForecast.optimizationOpportunities.filter(o => o.status === 'Implemented').length,
    rejected: costForecast.optimizationOpportunities.filter(o => o.status === 'Rejected').length
  };

  res.status(200).json({
    success: true,
    data: {
      totalSavings,
      netSavings,
      savingsPercentage,
      opportunitiesCount: costForecast.optimizationOpportunities.length,
      opportunitiesByStatus,
      topOpportunities: costForecast.optimizationOpportunities
        .sort((a, b) => b.potentialSavings - a.potentialSavings)
        .slice(0, 5)
    }
  });
});

// @desc    Create project budget
// @route   POST /api/cost-optimization/budget
// @access  Private
exports.createProjectBudget = asyncHandler(async (req, res) => {
  const {
    project,
    budgetName,
    fiscalYear,
    totalBudget,
    budgetCategories,
    milestones,
    costControls
  } = req.body;

  const projectExists = await Project.findById(project);
  if (!projectExists) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Calculate allocated budget
  const allocatedBudget = budgetCategories.reduce((sum, cat) => sum + cat.allocated, 0);

  const projectBudget = await ProjectBudget.create({
    project,
    budgetName,
    fiscalYear,
    totalBudget,
    allocatedBudget,
    budgetCategories: budgetCategories.map(cat => ({
      ...cat,
      available: cat.allocated,
      percentage: ((cat.allocated / totalBudget) * 100).toFixed(2)
    })),
    milestones: milestones || [],
    costControls: costControls || [],
    remainingBudget: totalBudget,
    createdBy: req.user._id,
    status: 'Draft'
  });

  res.status(201).json({
    success: true,
    data: projectBudget
  });
});

// @desc    Get all project budgets
// @route   GET /api/cost-optimization/budget
// @access  Private
exports.getProjectBudgets = asyncHandler(async (req, res) => {
  const { project, fiscalYear, status } = req.query;
  
  const filter = {};
  if (project) filter.project = project;
  if (fiscalYear) filter.fiscalYear = fiscalYear;
  if (status) filter.status = status;

  const budgets = await ProjectBudget.find(filter)
    .populate('project', 'name location')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: budgets.length,
    data: budgets
  });
});

// @desc    Get project budget by ID
// @route   GET /api/cost-optimization/budget/:id
// @access  Private
exports.getProjectBudgetById = asyncHandler(async (req, res) => {
  const budget = await ProjectBudget.findById(req.params.id)
    .populate('project', 'name location infrastructure timeline')
    .populate('createdBy', 'name email')
    .populate('lastModifiedBy', 'name email')
    .populate('approvalChain.approver', 'name email role');

  if (!budget) {
    res.status(404);
    throw new Error('Project budget not found');
  }

  res.status(200).json({
    success: true,
    data: budget
  });
});

// @desc    Update project budget
// @route   PUT /api/cost-optimization/budget/:id
// @access  Private
exports.updateProjectBudget = asyncHandler(async (req, res) => {
  let budget = await ProjectBudget.findById(req.params.id);

  if (!budget) {
    res.status(404);
    throw new Error('Project budget not found');
  }

  req.body.lastModifiedBy = req.user._id;

  budget = await ProjectBudget.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: budget
  });
});

// @desc    Record spending
// @route   POST /api/cost-optimization/budget/:id/spending
// @access  Private
exports.recordSpending = asyncHandler(async (req, res) => {
  const { category, amount, description } = req.body;

  const budget = await ProjectBudget.findById(req.params.id);

  if (!budget) {
    res.status(404);
    throw new Error('Project budget not found');
  }

  await budget.recordSpending(category, amount, description);

  res.status(200).json({
    success: true,
    data: budget,
    message: 'Spending recorded successfully'
  });
});

// @desc    Add budget revision
// @route   POST /api/cost-optimization/budget/:id/revision
// @access  Private
exports.addBudgetRevision = asyncHandler(async (req, res) => {
  const budget = await ProjectBudget.findById(req.params.id);

  if (!budget) {
    res.status(404);
    throw new Error('Project budget not found');
  }

  const { newAmount, reason, category, justification } = req.body;

  budget.budgetRevisions.push({
    previousAmount: budget.totalBudget,
    newAmount,
    reason,
    category,
    justification,
    approvedBy: req.user._id
  });

  budget.totalBudget = newAmount;
  await budget.updateRemainingBudget();

  res.status(200).json({
    success: true,
    data: budget,
    message: 'Budget revision added successfully'
  });
});

// @desc    Get budget performance metrics
// @route   GET /api/cost-optimization/budget/:id/performance
// @access  Private
exports.getBudgetPerformance = asyncHandler(async (req, res) => {
  const budget = await ProjectBudget.findById(req.params.id);

  if (!budget) {
    res.status(404);
    throw new Error('Project budget not found');
  }

  const utilizationPercentage = budget.utilizationPercentage;
  const burnRate = budget.burnRate;
  
  const categoryPerformance = budget.budgetCategories.map(cat => ({
    category: cat.category,
    allocated: cat.allocated,
    spent: cat.spent,
    utilization: ((cat.spent / cat.allocated) * 100).toFixed(2),
    remaining: cat.available,
    status: cat.spent > cat.allocated ? 'Over Budget' : 
            (cat.spent / cat.allocated) > 0.9 ? 'Critical' : 
            (cat.spent / cat.allocated) > 0.75 ? 'Warning' : 'On Track'
  }));

  const milestonePerformance = budget.milestones.map(m => ({
    name: m.name,
    targetDate: m.targetDate,
    budgetAllocation: m.budgetAllocation,
    actualSpend: m.actualSpend,
    variance: m.actualSpend - m.budgetAllocation,
    status: m.status,
    completionPercentage: m.completionPercentage
  }));

  const activeAlerts = budget.alerts.filter(a => !a.isResolved);

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalBudget: budget.totalBudget,
        actualSpend: budget.actualSpend,
        remainingBudget: budget.remainingBudget,
        utilizationPercentage,
        burnRate,
        alertsCount: activeAlerts.length
      },
      categoryPerformance,
      milestonePerformance,
      alerts: activeAlerts,
      performanceMetrics: budget.performanceMetrics
    }
  });
});

// @desc    Compare budget vs forecast
// @route   GET /api/cost-optimization/compare/:budgetId/:forecastId
// @access  Private
exports.compareBudgetVsForecast = asyncHandler(async (req, res) => {
  const budget = await ProjectBudget.findById(req.params.budgetId);
  const forecast = await CostForecast.findById(req.params.forecastId);

  if (!budget || !forecast) {
    res.status(404);
    throw new Error('Budget or forecast not found');
  }

  const comparison = {
    budgetTotal: budget.totalBudget,
    forecastTotal: forecast.totalEstimatedCost,
    variance: forecast.totalEstimatedCost - budget.totalBudget,
    variancePercentage: (((forecast.totalEstimatedCost - budget.totalBudget) / budget.totalBudget) * 100).toFixed(2),
    categoryComparison: budget.budgetCategories.map(budgetCat => {
      const forecastCategory = {
        materials: forecast.costBreakdown.materials,
        labor: forecast.costBreakdown.labor,
        equipment: forecast.costBreakdown.equipment,
        transportation: forecast.costBreakdown.transportation,
        taxes: forecast.costBreakdown.taxes,
        overhead: forecast.costBreakdown.overhead
      };
      
      const forecastAmount = forecastCategory[budgetCat.category.toLowerCase()] || 0;
      
      return {
        category: budgetCat.category,
        budgetAllocated: budgetCat.allocated,
        forecastEstimate: forecastAmount,
        variance: forecastAmount - budgetCat.allocated,
        variancePercentage: budgetCat.allocated > 0 
          ? (((forecastAmount - budgetCat.allocated) / budgetCat.allocated) * 100).toFixed(2)
          : 0
      };
    }),
    optimizationPotential: forecast.calculateTotalSavings(),
    riskExposure: forecast.riskFactors.reduce((sum, risk) => {
      return sum + (risk.potentialCostIncrease || 0);
    }, 0)
  };

  res.status(200).json({
    success: true,
    data: comparison
  });
});

module.exports = exports;
