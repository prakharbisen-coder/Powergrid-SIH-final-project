const BOQ = require('../models/BOQ');
const Project = require('../models/Project');

// @desc    Get BOQ by project ID
// @route   GET /api/boq/project/:projectId
// @access  Private
exports.getBOQByProject = async (req, res) => {
  try {
    const boq = await BOQ.findOne({ project: req.params.projectId })
      .populate('project', 'name projectId')
      .populate('approvedBy', 'name email');

    if (!boq) {
      return res.status(404).json({
        success: false,
        message: 'BOQ not found for this project'
      });
    }

    // Calculate summary metrics
    const totalItems = boq.items.length;
    const totalBOQQuantity = boq.items.reduce((sum, item) => sum + item.boqQuantity, 0);
    const totalConsumedQuantity = boq.items.reduce((sum, item) => sum + item.consumedQuantity, 0);
    const totalRemainingQuantity = totalBOQQuantity - totalConsumedQuantity;
    const overallProgress = totalBOQQuantity > 0 ? ((totalConsumedQuantity / totalBOQQuantity) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: boq,
      summary: {
        totalItems,
        totalBOQQuantity,
        totalConsumedQuantity,
        totalRemainingQuantity,
        overallProgress: parseFloat(overallProgress),
        totalBOQValue: boq.totalBOQValue,
        totalConsumedValue: boq.totalConsumedValue
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create or update BOQ for a project
// @route   POST /api/boq
// @access  Private
exports.createOrUpdateBOQ = async (req, res) => {
  try {
    const { projectId, items, status, notes } = req.body;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if BOQ already exists
    let boq = await BOQ.findOne({ project: projectId });

    if (boq) {
      // Update existing BOQ
      boq.items = items;
      boq.status = status || boq.status;
      boq.notes = notes || boq.notes;
      boq.version += 1;
      await boq.save();
    } else {
      // Create new BOQ
      boq = await BOQ.create({
        project: projectId,
        projectId: project.projectId,
        projectName: project.name,
        items,
        status: status || 'Draft',
        notes
      });
    }

    res.status(201).json({
      success: true,
      data: boq,
      message: boq.version > 1 ? 'BOQ updated successfully' : 'BOQ created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add single BOQ item
// @route   POST /api/boq/:projectId/item
// @access  Private
exports.addBOQItem = async (req, res) => {
  try {
    const { projectId } = req.params;
    const itemData = req.body;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Find or create BOQ
    let boq = await BOQ.findOne({ project: projectId });

    if (!boq) {
      boq = await BOQ.create({
        project: projectId,
        projectId: project.projectId,
        projectName: project.name,
        items: [itemData]
      });
    } else {
      boq.items.push(itemData);
      await boq.save();
    }

    res.status(201).json({
      success: true,
      data: boq,
      message: 'BOQ item added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update BOQ item
// @route   PUT /api/boq/:projectId/item/:itemId
// @access  Private
exports.updateBOQItem = async (req, res) => {
  try {
    const { projectId, itemId } = req.params;
    const updateData = req.body;

    const boq = await BOQ.findOne({ project: projectId });
    
    if (!boq) {
      return res.status(404).json({
        success: false,
        message: 'BOQ not found'
      });
    }

    const item = boq.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'BOQ item not found'
      });
    }

    // Update item fields
    Object.keys(updateData).forEach(key => {
      item[key] = updateData[key];
    });

    await boq.save();

    res.status(200).json({
      success: true,
      data: boq,
      message: 'BOQ item updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete BOQ item
// @route   DELETE /api/boq/:projectId/item/:itemId
// @access  Private
exports.deleteBOQItem = async (req, res) => {
  try {
    const { projectId, itemId } = req.params;

    const boq = await BOQ.findOne({ project: projectId });
    
    if (!boq) {
      return res.status(404).json({
        success: false,
        message: 'BOQ not found'
      });
    }

    boq.items.pull(itemId);
    await boq.save();

    res.status(200).json({
      success: true,
      data: boq,
      message: 'BOQ item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update consumed quantity for BOQ item
// @route   PUT /api/boq/:projectId/item/:itemId/consumption
// @access  Private
exports.updateConsumption = async (req, res) => {
  try {
    const { projectId, itemId } = req.params;
    const { consumedQuantity } = req.body;

    const boq = await BOQ.findOne({ project: projectId });
    
    if (!boq) {
      return res.status(404).json({
        success: false,
        message: 'BOQ not found'
      });
    }

    const item = boq.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'BOQ item not found'
      });
    }

    item.consumedQuantity = consumedQuantity;
    await boq.save();

    res.status(200).json({
      success: true,
      data: boq,
      message: 'Consumption updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get BOQ summary for forecasting
// @route   GET /api/boq/project/:projectId/forecast-data
// @access  Private
exports.getBOQForForecasting = async (req, res) => {
  try {
    const boq = await BOQ.findOne({ project: req.params.projectId });

    if (!boq) {
      return res.status(404).json({
        success: false,
        message: 'BOQ not found for this project'
      });
    }

    // Format data for forecasting model
    const forecastData = boq.items.map(item => ({
      material: item.category,
      item_name: item.itemName,
      item_code: item.itemCode,
      unit: item.unit,
      total_boq_quantity: item.boqQuantity,
      consumed_quantity: item.consumedQuantity,
      remaining_quantity: item.boqQuantity - item.consumedQuantity,
      consumption_rate: item.boqQuantity > 0 ? (item.consumedQuantity / item.boqQuantity) : 0,
      tower_type: item.towerType,
      specifications: item.specifications
    }));

    const summary = {
      total_materials: boq.items.length,
      total_boq_value: boq.totalBOQValue,
      overall_consumption_rate: boq.items.reduce((sum, item) => {
        return sum + (item.boqQuantity > 0 ? (item.consumedQuantity / item.boqQuantity) : 0);
      }, 0) / boq.items.length
    };

    res.status(200).json({
      success: true,
      data: {
        boq_items: forecastData,
        summary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve BOQ
// @route   PUT /api/boq/:projectId/approve
// @access  Private
exports.approveBOQ = async (req, res) => {
  try {
    const { projectId } = req.params;

    const boq = await BOQ.findOne({ project: projectId });
    
    if (!boq) {
      return res.status(404).json({
        success: false,
        message: 'BOQ not found'
      });
    }

    boq.status = 'Approved';
    boq.approvedBy = req.user._id;
    boq.approvedAt = Date.now();
    await boq.save();

    res.status(200).json({
      success: true,
      data: boq,
      message: 'BOQ approved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upload BOQ from CSV file
// @route   POST /api/boq/upload/:projectId
// @access  Private
exports.uploadBOQFromCSV = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { csvData } = req.body; // Array of CSV rows

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Parse CSV data and create BOQ items
    const boqItems = [];
    let totalBOQValue = 0;

    for (const row of csvData) {
      const item = {
        itemCode: row.itemCode || `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        itemName: row.itemName,
        category: row.category || 'Others',
        unit: row.unit || 'NOS',
        boqQuantity: parseFloat(row.boqQuantity) || 0,
        consumedQuantity: parseFloat(row.consumedQuantity) || 0,
        specifications: row.specifications || '',
        towerType: row.towerType || 'All',
        remarks: row.remarks || '',
        unitRate: parseFloat(row.unitRate) || 0
      };

      // Calculate total cost
      item.totalCost = item.boqQuantity * item.unitRate;
      totalBOQValue += item.totalCost;

      boqItems.push(item);
    }

    // Check if BOQ already exists for this project
    let boq = await BOQ.findOne({ project: projectId });

    if (boq) {
      // Update existing BOQ
      boq.items = [...boq.items, ...boqItems];
      boq.totalBOQValue = boq.items.reduce((sum, item) => sum + (item.totalCost || 0), 0);
      boq.totalConsumedValue = boq.items.reduce((sum, item) => sum + ((item.consumedQuantity || 0) * (item.unitRate || 0)), 0);
      boq.status = 'Draft';
      await boq.save();
    } else {
      // Create new BOQ
      boq = await BOQ.create({
        project: projectId,
        projectName: project.name,
        items: boqItems,
        totalBOQValue,
        totalConsumedValue: 0,
        status: 'Draft',
        version: 1,
        createdBy: req.user._id
      });
    }

    res.status(201).json({
      success: true,
      message: `Successfully imported ${boqItems.length} items from CSV`,
      data: boq,
      summary: {
        itemsImported: boqItems.length,
        totalBOQValue: boq.totalBOQValue
      }
    });
  } catch (error) {
    console.error('CSV Upload Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload BOQ from CSV'
    });
  }
};

module.exports = exports;
