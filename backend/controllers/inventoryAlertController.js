/**
 * INVENTORY ALERT CONTROLLER
 * Handles HTTP requests for warehouse inventory alerts
 */

const WarehouseMaterial = require('../models/WarehouseMaterial');
const Material = require('../models/Material');
const Warehouse = require('../models/Warehouse');
const { checkAndTriggerAlert, getAllLowStockMaterials, runAutomatedStockCheck } = require('../services/alertService');

/**
 * @route   POST /api/inventory/warehouse/add
 * @desc    Add a new warehouse with geolocation
 * @access  Public
 */
exports.addWarehouse = async (req, res) => {
  try {
    const { warehouseId, name, latitude, longitude, address, city, state, pincode, capacity } = req.body;
    
    // Validate required fields
    if (!warehouseId || !name || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide warehouseId, name, latitude, and longitude'
      });
    }
    
    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be between -90 and 90 degrees'
      });
    }
    
    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be between -180 and 180 degrees'
      });
    }
    
    // Create warehouse
    const warehouse = await Warehouse.create({
      warehouseId,
      name,
      location: {
        address: address || '',
        city: city || '',
        state: state || '',
        pincode: pincode || '',
        coordinates: {
          latitude,
          longitude
        }
      },
      capacity: {
        total: capacity || 10000
      },
      status: 'operational'
    });
    
    res.status(201).json({
      success: true,
      message: 'Warehouse added successfully',
      data: warehouse
    });
    
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse with this ID already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   POST /api/inventory/material/add
 * @desc    Add material to warehouse inventory
 * @access  Public
 */
exports.addMaterial = async (req, res) => {
  try {
    const { warehouseId, materialName, qty, minQty, unit, category } = req.body;
    
    if (!warehouseId || !materialName || qty === undefined || minQty === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide warehouseId, materialName, qty, and minQty'
      });
    }
    
    // Check if warehouse exists
    const warehouse = await Warehouse.findOne({ warehouseId });
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }
    
    const material = await WarehouseMaterial.create({
      warehouseId,
      materialName,
      qty,
      minQty,
      unit: unit || 'units',
      category: category || 'Other'
    });
    
    res.status(201).json({
      success: true,
      message: 'Material added successfully',
      data: material
    });
    
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Material already exists in this warehouse. Use update endpoint instead.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   POST /api/inventory/material/update
 * @desc    Update material quantity and auto-trigger alert if low
 * @access  Public
 */
exports.updateMaterial = async (req, res) => {
  try {
    const { warehouseId, materialName, qty } = req.body;
    
    if (!warehouseId || !materialName || qty === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide warehouseId, materialName, and qty'
      });
    }
    
    // Find and update material
    const material = await WarehouseMaterial.findOneAndUpdate(
      { warehouseId, materialName },
      { qty },
      { new: true, runValidators: true }
    );
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found in warehouse'
      });
    }
    
    // AUTO-TRIGGER ALERT CHECK
    const alertResult = await checkAndTriggerAlert(warehouseId, materialName);
    
    res.json({
      success: true,
      message: 'Material updated successfully',
      data: {
        material: {
          warehouseId: material.warehouseId,
          materialName: material.materialName,
          qty: material.qty,
          minQty: material.minQty,
          unit: material.unit,
          alertStatus: material.alertStatus,
          stockPercentage: Math.round((material.qty / material.minQty) * 100)
        },
        alert: alertResult
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/inventory/alert/test
 * @desc    Trigger a test alert for specific warehouse material
 * @access  Public
 */
exports.testAlert = async (req, res) => {
  try {
    const { warehouseId, materialName } = req.query;
    
    if (!warehouseId || !materialName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide warehouseId and materialName as query parameters',
        example: '/api/inventory/alert/test?warehouseId=WH001&materialName=Tower%20Parts'
      });
    }
    
    const alertData = await checkAndTriggerAlert(warehouseId, materialName);
    
    res.json({
      success: true,
      data: alertData
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/inventory/alert/all
 * @desc    Get all materials currently below threshold
 * @access  Public
 */
exports.getAllAlerts = async (req, res) => {
  try {
    // Get low stock from WarehouseMaterial model
    const lowStockMaterials = await getAllLowStockMaterials();
    
    // Also get low stock from Material model
    const lowStockFromMaterials = await Material.find({
      status: { $in: ['low', 'critical', 'out-of-stock'] }
    });

    // Map existing materials to warehouse format
    const existingLowStock = await Promise.all(
      lowStockFromMaterials.map(async (mat) => {
        // Try to find matching warehouse by location
        const locationCity = mat.location.split(',')[0].trim();
        const warehouse = await Warehouse.findOne({ 
          'location.city': new RegExp(locationCity, 'i')
        });

        if (warehouse) {
          return {
            _id: mat._id,
            warehouseId: warehouse.warehouseId,
            materialName: mat.name,
            qty: mat.quantity,
            minQty: mat.threshold,
            unit: mat.unit,
            category: mat.category,
            alertStatus: mat.status,
            location: mat.location,
            source: 'existing'
          };
        }
        return null;
      })
    );

    // Filter out nulls and combine
    const allLowStock = [
      ...lowStockMaterials,
      ...existingLowStock.filter(item => item !== null)
    ];
    
    const alerts = await Promise.all(
      allLowStock.map(async (material) => {
        return await checkAndTriggerAlert(material.warehouseId, material.materialName);
      })
    );
    
    res.json({
      success: true,
      count: alerts.length,
      low_stock_materials: allLowStock,
      data: alerts
    });
    
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/inventory/alert/run-check
 * @desc    Run automated stock check across all warehouses
 * @access  Public
 */
exports.runStockCheck = async (req, res) => {
  try {
    const result = await runAutomatedStockCheck();
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/inventory/materials/:warehouseId
 * @desc    Get all materials for a specific warehouse
 * @access  Public
 */
exports.getWarehouseMaterials = async (req, res) => {
  try {
    const { warehouseId } = req.params;

    // Find warehouse location
    const warehouse = await Warehouse.findOne({ warehouseId });
    if (!warehouse) {
      return res.status(404).json({ 
        success: false, 
        error: 'Warehouse not found', 
        warehouses: [],
        materials: [] 
      });
    }

    // Get materials from WarehouseMaterial model (new inventory system)
    const warehouseMaterials = await WarehouseMaterial.find({ warehouseId });

    // Also get materials from Material model that match warehouse location
    const locationPattern = new RegExp(warehouse.location.city, 'i');
    const existingMaterials = await Material.find({ location: locationPattern });

    // Transform existing materials to warehouse format
    const transformedMaterials = existingMaterials.map(mat => ({
      _id: mat._id,
      warehouseId,
      materialName: mat.name,
      qty: mat.quantity,
      minQty: mat.threshold,
      unit: mat.unit || 'units',
      category: mat.category,
      alertStatus: mat.status,
      source: 'existing'
    }));

    // Transform warehouse materials
    const formattedWarehouseMaterials = warehouseMaterials.map(mat => ({
      _id: mat._id,
      warehouseId: mat.warehouseId,
      materialName: mat.materialName,
      qty: mat.qty,
      minQty: mat.minQty,
      unit: mat.unit,
      category: mat.category,
      alertStatus: mat.alertStatus,
      source: 'warehouse'
    }));

    // Combine both sources
    const allMaterials = [...transformedMaterials, ...formattedWarehouseMaterials];
    
    res.json({
      success: true,
      warehouseId,
      warehouse: warehouse.name,
      count: allMaterials.length,
      materials: allMaterials,
      data: allMaterials
    });
    
  } catch (error) {
    console.error('Error fetching warehouse materials:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/inventory/warehouses
 * @desc    Get all warehouses with their locations
 * @access  Public
 */
exports.getAllWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ status: 'operational' });
    
    res.json({
      success: true,
      count: warehouses.length,
      data: warehouses
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
