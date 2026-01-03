const Budget = require('../models/Budget');

// @desc    Get all budgets
// @route   GET /api/budget
// @access  Private
exports.getBudgets = async (req, res) => {
  try {
    const { category, status, fiscalYear } = req.query;
    
    let query = {};
    
    if (category) query.category = category;
    if (status) query.status = status;
    if (fiscalYear) query.fiscalYear = fiscalYear;

    const budgets = await Budget.find(query).sort({ createdAt: -1 });

    // Calculate totals
    const totals = budgets.reduce((acc, budget) => {
      acc.allocated += budget.allocated;
      acc.spent += budget.spent;
      acc.projected += budget.projected || 0;
      return acc;
    }, { allocated: 0, spent: 0, projected: 0 });

    res.status(200).json({
      success: true,
      count: budgets.length,
      totals,
      data: budgets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single budget
// @route   GET /api/budget/:id
// @access  Private
exports.getBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    res.status(200).json({
      success: true,
      data: budget
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create budget
// @route   POST /api/budget
// @access  Private (Admin/Manager)
exports.createBudget = async (req, res) => {
  try {
    const budget = await Budget.create(req.body);

    res.status(201).json({
      success: true,
      data: budget
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update budget
// @route   PUT /api/budget/:id
// @access  Private (Admin/Manager)
exports.updateBudget = async (req, res) => {
  try {
    const budget = await Budget.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    res.status(200).json({
      success: true,
      data: budget
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add transaction to budget
// @route   POST /api/budget/:id/transaction
// @access  Private
exports.addTransaction = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    budget.transactions.push(req.body);
    
    // Update spent amount if it's an expense
    if (req.body.type === 'expense') {
      budget.spent += req.body.amount;
    }

    await budget.save();

    res.status(200).json({
      success: true,
      data: budget
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete budget
// @route   DELETE /api/budget/:id
// @access  Private (Admin only)
exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findByIdAndDelete(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
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
