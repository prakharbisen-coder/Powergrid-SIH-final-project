/**
 * SEED SCRIPT FOR INVENTORY ALERT SYSTEM
 * Populates database with sample warehouses and materials for testing
 * 
 * Run with: node backend/seedInventory.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Warehouse = require('./models/Warehouse');
const WarehouseMaterial = require('./models/WarehouseMaterial');

// Load env vars
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Sample warehouses across India with real coordinates
const warehouses = [
  {
    warehouseId: 'WH001',
    name: 'Nagpur Central Warehouse',
    location: {
      address: 'MIDC Industrial Area',
      city: 'Nagpur',
      state: 'Maharashtra',
      pincode: '440016',
      coordinates: {
        latitude: 21.1458,
        longitude: 79.0882
      }
    },
    capacity: { total: 15000, used: 8500 },
    status: 'operational'
  },
  {
    warehouseId: 'WH002',
    name: 'Raipur Distribution Center',
    location: {
      address: 'Raipur Industrial Zone',
      city: 'Raipur',
      state: 'Chhattisgarh',
      pincode: '492001',
      coordinates: {
        latitude: 21.2514,
        longitude: 81.6296
      }
    },
    capacity: { total: 12000, used: 5800 },
    status: 'operational'
  },
  {
    warehouseId: 'WH003',
    name: 'Amravati Storage Facility',
    location: {
      address: 'Amravati MIDC',
      city: 'Amravati',
      state: 'Maharashtra',
      pincode: '444601',
      coordinates: {
        latitude: 20.9333,
        longitude: 77.7500
      }
    },
    capacity: { total: 10000, used: 6200 },
    status: 'operational'
  },
  {
    warehouseId: 'WH004',
    name: 'Jabalpur Regional Hub',
    location: {
      address: 'Jabalpur Industrial Estate',
      city: 'Jabalpur',
      state: 'Madhya Pradesh',
      pincode: '482001',
      coordinates: {
        latitude: 23.1815,
        longitude: 79.9864
      }
    },
    capacity: { total: 18000, used: 12300 },
    status: 'operational'
  },
  {
    warehouseId: 'WH005',
    name: 'Bhopal Supply Depot',
    location: {
      address: 'Mandideep Industrial Area',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      pincode: '462046',
      coordinates: {
        latitude: 23.2599,
        longitude: 77.4126
      }
    },
    capacity: { total: 20000, used: 14500 },
    status: 'operational'
  },
  {
    warehouseId: 'WH006',
    name: 'Pune West Warehouse',
    location: {
      address: 'Hinjewadi Phase 2',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411057',
      coordinates: {
        latitude: 18.5793,
        longitude: 73.7089
      }
    },
    capacity: { total: 25000, used: 18900 },
    status: 'operational'
  }
];

// Sample materials with varying stock levels (some below threshold)
const materials = [
  // WH001 - Nagpur (LOW STOCK scenario)
  { warehouseId: 'WH001', materialName: 'Tower Parts', qty: 150, minQty: 300, unit: 'units', category: 'Steel' },
  { warehouseId: 'WH001', materialName: 'Conductors ACSR', qty: 800, minQty: 500, unit: 'meters', category: 'Conductors' },
  { warehouseId: 'WH001', materialName: 'Insulators Polymer', qty: 45, minQty: 200, unit: 'units', category: 'Insulators' },
  { warehouseId: 'WH001', materialName: 'Circuit Breakers', qty: 380, minQty: 400, unit: 'units', category: 'Circuit Breakers' },
  
  // WH002 - Raipur (GOOD STOCK)
  { warehouseId: 'WH002', materialName: 'Tower Parts', qty: 850, minQty: 300, unit: 'units', category: 'Steel' },
  { warehouseId: 'WH002', materialName: 'Conductors ACSR', qty: 1200, minQty: 500, unit: 'meters', category: 'Conductors' },
  { warehouseId: 'WH002', materialName: 'Insulators Polymer', qty: 420, minQty: 200, unit: 'units', category: 'Insulators' },
  { warehouseId: 'WH002', materialName: 'Transformers 33KV', qty: 25, minQty: 10, unit: 'units', category: 'Transformers' },
  
  // WH003 - Amravati (GOOD STOCK)
  { warehouseId: 'WH003', materialName: 'Tower Parts', qty: 680, minQty: 300, unit: 'units', category: 'Steel' },
  { warehouseId: 'WH003', materialName: 'Conductors ACSR', qty: 950, minQty: 500, unit: 'meters', category: 'Conductors' },
  { warehouseId: 'WH003', materialName: 'Earthing Materials', qty: 320, minQty: 150, unit: 'kg', category: 'Earthing' },
  { warehouseId: 'WH003', materialName: 'Power Cables', qty: 1500, minQty: 800, unit: 'meters', category: 'Cables' },
  
  // WH004 - Jabalpur (MIXED - some low)
  { warehouseId: 'WH004', materialName: 'Tower Parts', qty: 280, minQty: 300, unit: 'units', category: 'Steel' },
  { warehouseId: 'WH004', materialName: 'Conductors ACSR', qty: 1400, minQty: 500, unit: 'meters', category: 'Conductors' },
  { warehouseId: 'WH004', materialName: 'Insulators Polymer', qty: 580, minQty: 200, unit: 'units', category: 'Insulators' },
  { warehouseId: 'WH004', materialName: 'Steel Structures', qty: 125, minQty: 250, unit: 'tons', category: 'Steel' },
  
  // WH005 - Bhopal (GOOD STOCK)
  { warehouseId: 'WH005', materialName: 'Tower Parts', qty: 920, minQty: 300, unit: 'units', category: 'Steel' },
  { warehouseId: 'WH005', materialName: 'Conductors ACSR', qty: 2100, minQty: 500, unit: 'meters', category: 'Conductors' },
  { warehouseId: 'WH005', materialName: 'Circuit Breakers', qty: 780, minQty: 400, unit: 'units', category: 'Circuit Breakers' },
  { warehouseId: 'WH005', materialName: 'Transformers 33KV', qty: 32, minQty: 10, unit: 'units', category: 'Transformers' },
  
  // WH006 - Pune (GOOD STOCK)
  { warehouseId: 'WH006', materialName: 'Tower Parts', qty: 1100, minQty: 300, unit: 'units', category: 'Steel' },
  { warehouseId: 'WH006', materialName: 'Conductors ACSR', qty: 1800, minQty: 500, unit: 'meters', category: 'Conductors' },
  { warehouseId: 'WH006', materialName: 'Power Cables', qty: 2500, minQty: 800, unit: 'meters', category: 'Cables' },
  { warehouseId: 'WH006', materialName: 'Hardware Fittings', qty: 5600, minQty: 2000, unit: 'pieces', category: 'Hardware' }
];

async function seedDatabase() {
  try {
    console.log('\n🌱 Starting database seed...\n');
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Warehouse.deleteMany({ warehouseId: { $in: warehouses.map(w => w.warehouseId) } });
    await WarehouseMaterial.deleteMany({ warehouseId: { $in: warehouses.map(w => w.warehouseId) } });
    console.log('✅ Cleared\n');
    
    // Insert warehouses
    console.log('📍 Inserting warehouses...');
    const insertedWarehouses = await Warehouse.insertMany(warehouses);
    console.log(`✅ Added ${insertedWarehouses.length} warehouses\n`);
    
    // Display warehouse locations
    console.log('WAREHOUSE LOCATIONS:');
    console.log('─────────────────────────────────────────────────────────');
    insertedWarehouses.forEach(wh => {
      console.log(`${wh.name}`);
      console.log(`  📍 Coordinates: ${wh.location.coordinates.latitude}°N, ${wh.location.coordinates.longitude}°E`);
      console.log(`  📍 Location: ${wh.location.city}, ${wh.location.state}`);
      console.log('');
    });
    
    // Insert materials
    console.log('📦 Inserting materials...');
    const insertedMaterials = await WarehouseMaterial.insertMany(materials);
    console.log(`✅ Added ${insertedMaterials.length} material records\n`);
    
    // Display low stock items
    const lowStockItems = insertedMaterials.filter(m => m.qty < m.minQty);
    console.log('⚠️  LOW STOCK ITEMS CREATED FOR TESTING:');
    console.log('─────────────────────────────────────────────────────────');
    lowStockItems.forEach(item => {
      const warehouse = insertedWarehouses.find(w => w.warehouseId === item.warehouseId);
      console.log(`🏭 ${warehouse.name}`);
      console.log(`   Material: ${item.materialName}`);
      console.log(`   Stock: ${item.qty}/${item.minQty} ${item.unit}`);
      console.log(`   Status: ${item.alertStatus.toUpperCase()}`);
      console.log('');
    });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('🧪 TEST THE SYSTEM:');
    console.log('─────────────────────────────────────────────────────────');
    console.log('1. Test Alert:');
    console.log('   GET http://localhost:5000/api/inventory/alert/test?warehouseId=WH001&materialName=Tower%20Parts\n');
    console.log('2. Update Material (triggers auto-alert):');
    console.log('   POST http://localhost:5000/api/inventory/material/update');
    console.log('   Body: {"warehouseId":"WH001","materialName":"Tower Parts","qty":120}\n');
    console.log('3. Run Full Stock Check:');
    console.log('   GET http://localhost:5000/api/inventory/alert/run-check\n');
    console.log('4. Get All Alerts:');
    console.log('   GET http://localhost:5000/api/inventory/alert/all\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
