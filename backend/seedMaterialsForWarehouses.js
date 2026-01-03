/**
 * SEED MATERIALS WITH WAREHOUSE LOCATIONS
 * Adds materials to the existing Materials database with locations matching warehouses
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Material = require('./models/Material');
const Warehouse = require('./models/Warehouse');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Materials data with varying stock levels
const materialsData = [
  // Nagpur Central Warehouse - LOW STOCK
  { name: 'Tower Parts', category: 'Steel', quantity: 150, threshold: 300, location: 'Nagpur', status: 'low' },
  { name: 'Conductors ACSR', category: 'Conductors', quantity: 800, threshold: 500, location: 'Nagpur', status: 'optimal' },
  { name: 'Insulators Polymer', category: 'Insulators', quantity: 45, threshold: 200, location: 'Nagpur', status: 'critical' },
  { name: 'Circuit Breakers', category: 'Others', quantity: 380, threshold: 400, location: 'Nagpur', status: 'low' },
  { name: 'Steel Structures', category: 'Steel', quantity: 0, threshold: 100, location: 'Nagpur', status: 'out-of-stock' },
  
  // Raipur Distribution Center - GOOD STOCK
  { name: 'Tower Parts', category: 'Steel', quantity: 850, threshold: 300, location: 'Raipur', status: 'optimal' },
  { name: 'Conductors ACSR', category: 'Conductors', quantity: 1200, threshold: 500, location: 'Raipur', status: 'optimal' },
  { name: 'Insulators Polymer', category: 'Insulators', quantity: 420, threshold: 200, location: 'Raipur', status: 'optimal' },
  { name: 'Transformers 33KV', category: 'Others', quantity: 25, threshold: 10, location: 'Raipur', status: 'optimal' },
  { name: 'Hardware Fittings', category: 'Nuts/Bolts', quantity: 3500, threshold: 1000, location: 'Raipur', status: 'optimal' },
  
  // Amravati Storage Facility - GOOD STOCK
  { name: 'Tower Parts', category: 'Steel', quantity: 680, threshold: 300, location: 'Amravati', status: 'optimal' },
  { name: 'Conductors ACSR', category: 'Conductors', quantity: 950, threshold: 500, location: 'Amravati', status: 'optimal' },
  { name: 'Earthing Materials', category: 'Earthing', quantity: 320, threshold: 150, location: 'Amravati', status: 'optimal' },
  { name: 'Power Cables', category: 'Others', quantity: 1500, threshold: 800, location: 'Amravati', status: 'optimal' },
  
  // Jabalpur Regional Hub - MIXED
  { name: 'Tower Parts', category: 'Steel', quantity: 280, threshold: 300, location: 'Jabalpur', status: 'low' },
  { name: 'Conductors ACSR', category: 'Conductors', quantity: 1400, threshold: 500, location: 'Jabalpur', status: 'optimal' },
  { name: 'Insulators Polymer', category: 'Insulators', quantity: 580, threshold: 200, location: 'Jabalpur', status: 'optimal' },
  { name: 'Steel Structures', category: 'Steel', quantity: 125, threshold: 250, location: 'Jabalpur', status: 'critical' },
  { name: 'Circuit Breakers', category: 'Others', quantity: 190, threshold: 200, location: 'Jabalpur', status: 'low' },
  
  // Bhopal Supply Depot - EXCELLENT STOCK
  { name: 'Tower Parts', category: 'Steel', quantity: 920, threshold: 300, location: 'Bhopal', status: 'optimal' },
  { name: 'Conductors ACSR', category: 'Conductors', quantity: 2100, threshold: 500, location: 'Bhopal', status: 'optimal' },
  { name: 'Circuit Breakers', category: 'Others', quantity: 780, threshold: 400, location: 'Bhopal', status: 'optimal' },
  { name: 'Transformers 33KV', category: 'Others', quantity: 32, threshold: 10, location: 'Bhopal', status: 'optimal' },
  { name: 'Earthing Materials', category: 'Earthing', quantity: 450, threshold: 150, location: 'Bhopal', status: 'optimal' },
  
  // Pune West Warehouse - EXCELLENT STOCK
  { name: 'Tower Parts', category: 'Steel', quantity: 1100, threshold: 300, location: 'Pune', status: 'optimal' },
  { name: 'Conductors ACSR', category: 'Conductors', quantity: 1800, threshold: 500, location: 'Pune', status: 'optimal' },
  { name: 'Power Cables', category: 'Others', quantity: 2500, threshold: 800, location: 'Pune', status: 'optimal' },
  { name: 'Hardware Fittings', category: 'Nuts/Bolts', quantity: 5600, threshold: 2000, location: 'Pune', status: 'optimal' },
  { name: 'Insulators Polymer', category: 'Insulators', quantity: 850, threshold: 200, location: 'Pune', status: 'optimal' },
];

async function seedMaterials() {
  try {
    console.log('\n🌱 Seeding Materials Database...\n');
    
    // Clear existing materials from these warehouses
    console.log('🗑️  Clearing existing warehouse materials...');
    const warehouseCities = ['Nagpur', 'Raipur', 'Amravati', 'Jabalpur', 'Bhopal', 'Pune'];
    await Material.deleteMany({ 
      location: { $in: warehouseCities }
    });
    console.log('✅ Cleared\n');
    
    // Generate unique materialIds and insert
    console.log('📦 Inserting materials...');
    const materials = materialsData.map((mat, idx) => ({
      materialId: `MAT-${mat.location.toUpperCase()}-${mat.name.replace(/\s+/g, '-').toUpperCase()}-${Date.now() + idx}`,
      name: mat.name,
      category: mat.category,
      subCategory: 'Miscellaneous',
      quantity: mat.quantity,
      threshold: mat.threshold,
      location: mat.location,
      status: mat.status,
      unit: mat.name.includes('Cables') || mat.name.includes('ACSR') ? 'meters' : 
            mat.name.includes('Structures') ? 'tons' : 
            mat.name.includes('Materials') ? 'kg' : 'units',
      reusable: 0,
      price: Math.floor(Math.random() * 5000) + 1000,
      supplier: ['PowerGrid Corp', 'Electro Supplies Ltd', 'Steel India', 'Conductor Co'][Math.floor(Math.random() * 4)],
      description: `${mat.name} for power transmission projects`
    }));
    
    const inserted = await Material.insertMany(materials);
    console.log(`✅ Added ${inserted.length} materials\n`);
    
    // Display summary by warehouse
    console.log('═══════════════════════════════════════════════════════════');
    console.log('MATERIALS BY WAREHOUSE:');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    for (const city of warehouseCities) {
      const cityMaterials = inserted.filter(m => m.location === city);
      const lowStock = cityMaterials.filter(m => ['low', 'critical', 'out-of-stock'].includes(m.status));
      
      const warehouse = await Warehouse.findOne({ 'location.city': city });
      const warehouseName = warehouse ? warehouse.name : `${city} Warehouse`;
      
      console.log(`📍 ${warehouseName} (${city})`);
      console.log(`   Total Materials: ${cityMaterials.length}`);
      console.log(`   ⚠️  Low Stock Items: ${lowStock.length}`);
      
      if (lowStock.length > 0) {
        lowStock.forEach(mat => {
          console.log(`      • ${mat.name}: ${mat.quantity}/${mat.threshold} ${mat.unit} [${mat.status.toUpperCase()}]`);
        });
      }
      console.log('');
    }
    
    // Summary
    const allLowStock = inserted.filter(m => ['low', 'critical', 'out-of-stock'].includes(m.status));
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ SEEDING COMPLETE!`);
    console.log(`   Total Materials: ${inserted.length}`);
    console.log(`   Low Stock Alerts: ${allLowStock.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('🔗 NOW CHECK THE INVENTORY ALERTS PAGE:');
    console.log('   http://localhost:8081/inventory-alerts\n');
    
    console.log('💡 The system will show:');
    console.log('   • Low stock materials with geospatial alerts');
    console.log('   • Nearby warehouses that can supply materials');
    console.log('   • Distance and travel time calculations');
    console.log('   • Automated stock level monitoring\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedMaterials();
