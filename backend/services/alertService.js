/**
 * LOW STOCK ALERT SERVICE
 * Handles detection and notification of low inventory across warehouses
 */

const WarehouseMaterial = require('../models/WarehouseMaterial');
const Material = require('../models/Material');
const Warehouse = require('../models/Warehouse');
const { getNearbyWarehouses, estimateTravelTime } = require('../utils/geoUtils');
const { sendLowStockAlert } = require('./snsService');

/**
 * Check if a material is below minimum threshold and trigger alert
 * 
 * @param {String} warehouseId - ID of the warehouse to check
 * @param {String} materialName - Name of the material
 * @returns {Object} Alert data or null if stock is sufficient
 */
async function checkAndTriggerAlert(warehouseId, materialName) {
  try {
    // Find the material record - check both models
    let material = await WarehouseMaterial.findOne({ warehouseId, materialName });
    let isFromMaterialModel = false;
    
    // If not found in WarehouseMaterial, try Material model
    if (!material) {
      const warehouse = await Warehouse.findOne({ warehouseId });
      if (warehouse) {
        const locationPattern = new RegExp(warehouse.location.city, 'i');
        const existingMaterial = await Material.findOne({ 
          name: materialName,
          location: locationPattern 
        });
        
        if (existingMaterial) {
          // Transform Material model to WarehouseMaterial format
          material = {
            qty: existingMaterial.quantity,
            minQty: existingMaterial.threshold,
            unit: existingMaterial.unit || 'units',
            alertStatus: existingMaterial.status,
            materialName: existingMaterial.name,
            warehouseId: warehouseId
          };
          isFromMaterialModel = true;
        }
      }
    }
    
    if (!material) {
      throw new Error(`Material '${materialName}' not found in warehouse '${warehouseId}'`);
    }
    
    // Check if quantity is below minimum threshold
    if (material.qty >= material.minQty) {
      return {
        status: 'OK',
        message: 'Stock levels are sufficient',
        material: {
          name: materialName,
          current: material.qty,
          minimum: material.minQty,
          percentage: Math.round((material.qty / material.minQty) * 100)
        }
      };
    }
    
    // LOW STOCK DETECTED! 
    console.log('\n🚨🚨🚨 LOW STOCK ALERT 🚨🚨🚨');
    console.log('═══════════════════════════════════════');
    
    // Get warehouse details with coordinates
    const warehouse = await Warehouse.findOne({ warehouseId });
    
    if (!warehouse) {
      throw new Error(`Warehouse '${warehouseId}' not found`);
    }
    
    console.log(`📍 Warehouse: ${warehouse.name}`);
    console.log(`📦 Material: ${materialName}`);
    console.log(`⚠️  Current Stock: ${material.qty} ${material.unit}`);
    console.log(`📊 Minimum Required: ${material.minQty} ${material.unit}`);
    console.log(`🔻 Shortage: ${material.minQty - material.qty} ${material.unit}`);
    
    // Find nearby warehouses within 200 km
    const allWarehouses = await Warehouse.find({ 
      status: 'operational',
      warehouseId: { $ne: warehouseId } // Exclude current warehouse
    });
    
    const nearbyWarehouses = getNearbyWarehouses(warehouse, allWarehouses, 200);
    
    console.log(`\n🔍 Searching nearby warehouses (within 200 km)...`);
    console.log(`✅ Found ${nearbyWarehouses.length} nearby warehouses\n`);
    
    // Check stock availability in nearby warehouses
    const warehousesWithStock = [];
    
    for (const nearby of nearbyWarehouses) {
      // Check WarehouseMaterial first
      let nearbyMaterial = await WarehouseMaterial.findOne({
        warehouseId: nearby.warehouseId,
        materialName: materialName
      });
      
      // If not found, check Material model
      if (!nearbyMaterial) {
        const locationPattern = new RegExp(nearby.location.city, 'i');
        const existingMat = await Material.findOne({
          name: materialName,
          location: locationPattern
        });
        
        if (existingMat) {
          nearbyMaterial = {
            qty: existingMat.quantity,
            minQty: existingMat.threshold
          };
        }
      }
      
      warehousesWithStock.push({
        name: nearby.name,
        warehouseId: nearby.warehouseId,
        distance_km: nearby.distance_km,
        travel_time: estimateTravelTime(nearby.distance_km),
        available_stock: nearbyMaterial ? nearbyMaterial.qty : 0,
        can_supply: nearbyMaterial ? (nearbyMaterial.qty > nearbyMaterial.minQty) : false
      });
    }
    
    // Sort by availability (suppliers first) then by distance
    warehousesWithStock.sort((a, b) => {
      if (a.can_supply && !b.can_supply) return -1;
      if (!a.can_supply && b.can_supply) return 1;
      return a.distance_km - b.distance_km;
    });
    
    // Print nearby warehouses
    console.log('📋 NEARBY WAREHOUSES:');
    console.log('─────────────────────────────────────');
    warehousesWithStock.forEach((wh, index) => {
      const icon = wh.can_supply ? '✅' : '❌';
      console.log(`${index + 1}. ${icon} ${wh.name}`);
      console.log(`   Distance: ${wh.distance_km} km (${wh.travel_time})`);
      console.log(`   Stock: ${wh.available_stock} ${material.unit}`);
      console.log(`   Status: ${wh.can_supply ? 'CAN SUPPLY' : 'ALSO LOW/INSUFFICIENT'}`);
      console.log('');
    });
    
    console.log('═══════════════════════════════════════\n');
    
    // Send SNS notification if AWS is configured
    try {
      if (process.env.AWS_SNS_TOPIC_ARN && process.env.AWS_ACCESS_KEY_ID) {
        console.log('📤 Sending AWS SNS notification...');
        await sendLowStockAlert({
          warehouseName: warehouse.name,
          materialName: materialName,
          currentStock: material.qty,
          threshold: material.minQty,
          unit: material.unit,
          shortage: material.minQty - material.qty,
          severity: material.alertStatus || 'low'
        });
        console.log('✅ SNS notification sent successfully!\n');
      } else {
        console.log('⚠️  AWS SNS not configured. Skipping notification.\n');
      }
    } catch (snsError) {
      console.error('❌ SNS notification failed (continuing with alert):', snsError.message);
    }
    
    // Update last alert timestamp (only if not from Material model)
    if (!isFromMaterialModel && material.save) {
      material.lastAlertSent = new Date();
      await material.save();
    }
    
    // Return structured alert data
    return {
      status: 'LOW_STOCK_ALERT',
      severity: material.alertStatus,
      timestamp: new Date().toISOString(),
      warehouse: {
        id: warehouse.warehouseId,
        name: warehouse.name,
        location: {
          lat: warehouse.location.coordinates.latitude,
          lng: warehouse.location.coordinates.longitude,
          address: warehouse.location.address,
          city: warehouse.location.city,
          state: warehouse.location.state
        }
      },
      material: {
        name: materialName,
        available: material.qty,
        minimum_required: material.minQty,
        shortage: material.minQty - material.qty,
        unit: material.unit,
        stock_percentage: Math.round((material.qty / material.minQty) * 100)
      },
      nearby_warehouses: warehousesWithStock,
      recommended_action: warehousesWithStock.length > 0 
        ? `Transfer from ${warehousesWithStock[0].name} (${warehousesWithStock[0].distance_km} km away)`
        : 'No nearby warehouses available - initiate procurement',
      search_radius_km: 200
    };
    
  } catch (error) {
    console.error('❌ Error in alert system:', error.message);
    throw error;
  }
}

/**
 * Get all materials currently below threshold across all warehouses
 */
async function getAllLowStockMaterials() {
  try {
    // Get from WarehouseMaterial
    const lowStockMaterials = await WarehouseMaterial.find({
      $expr: { $lt: ['$qty', '$minQty'] }
    }).populate('warehouseId');
    
    // Also get from Material model (existing inventory)
    const lowStockFromMaterials = await Material.find({
      status: { $in: ['low', 'critical', 'out-of-stock'] }
    });
    
    // Transform and add materials from Material model
    const allWarehouses = await Warehouse.find({ status: 'operational' });
    const transformedMaterials = [];
    
    for (const mat of lowStockFromMaterials) {
      // Find matching warehouse by location
      const locationCity = mat.location.split(',')[0].trim();
      const warehouse = allWarehouses.find(wh => 
        wh.location.city.toLowerCase().includes(locationCity.toLowerCase())
      );
      
      if (warehouse) {
        transformedMaterials.push({
          warehouseId: warehouse.warehouseId,
          materialName: mat.name,
          qty: mat.quantity,
          minQty: mat.threshold,
          unit: mat.unit,
          category: mat.category,
          alertStatus: mat.status
        });
      }
    }
    
    return [...lowStockMaterials, ...transformedMaterials];
  } catch (error) {
    console.error('Error fetching low stock materials:', error);
    throw error;
  }
}

/**
 * Run automated check for all warehouses (can be scheduled with cron)
 */
async function runAutomatedStockCheck() {
  console.log('\n🔄 Running automated stock check across all warehouses...\n');
  
  const lowStockMaterials = await getAllLowStockMaterials();
  
  if (lowStockMaterials.length === 0) {
    console.log('✅ All materials are at sufficient levels\n');
    return { status: 'OK', message: 'No low stock detected' };
  }
  
  console.log(`⚠️  Found ${lowStockMaterials.length} materials below threshold\n`);
  
  const alerts = [];
  
  for (const material of lowStockMaterials) {
    const alert = await checkAndTriggerAlert(material.warehouseId, material.materialName);
    alerts.push(alert);
  }
  
  return {
    status: 'ALERTS_GENERATED',
    total_alerts: alerts.length,
    alerts: alerts
  };
}

module.exports = {
  checkAndTriggerAlert,
  getAllLowStockMaterials,
  runAutomatedStockCheck
};
