/**
 * Check Integration - Verify Materials are connected
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

async function checkIntegration() {
  try {
    console.log('\n🔍 CHECKING INVENTORY INTEGRATION\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Check Materials
    const materials = await Material.find();
    console.log(`📦 Total Materials in Database: ${materials.length}\n`);
    
    if (materials.length > 0) {
      console.log('MATERIALS BY STATUS:');
      console.log('─────────────────────────────────────────');
      const statusCounts = materials.reduce((acc, mat) => {
        acc[mat.status] = (acc[mat.status] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
      
      console.log('\n');
      
      // Show low stock materials
      const lowStock = materials.filter(m => 
        ['low', 'critical', 'out-of-stock'].includes(m.status)
      );
      
      if (lowStock.length > 0) {
        console.log('⚠️  LOW STOCK MATERIALS:');
        console.log('─────────────────────────────────────────');
        lowStock.forEach(mat => {
          console.log(`  • ${mat.name} (${mat.location})`);
          console.log(`    Stock: ${mat.quantity}/${mat.threshold} ${mat.unit}`);
          console.log(`    Status: ${mat.status.toUpperCase()}`);
          console.log('');
        });
      }
    }
    
    // Check Warehouses
    const warehouses = await Warehouse.find();
    console.log(`🏭 Total Warehouses: ${warehouses.length}\n`);
    
    if (warehouses.length > 0) {
      console.log('WAREHOUSE LOCATIONS:');
      console.log('─────────────────────────────────────────');
      warehouses.forEach(wh => {
        console.log(`  ${wh.warehouseId}: ${wh.name}`);
        console.log(`  📍 ${wh.location.city}, ${wh.location.state}`);
        console.log(`  🌐 ${wh.location.coordinates.latitude}°N, ${wh.location.coordinates.longitude}°E`);
        console.log('');
      });
    }
    
    // Match materials to warehouses
    console.log('═══════════════════════════════════════════════════════════');
    console.log('MATERIALS BY WAREHOUSE LOCATION:');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    for (const wh of warehouses) {
      const locationPattern = new RegExp(wh.location.city, 'i');
      const whMaterials = materials.filter(mat => locationPattern.test(mat.location));
      
      console.log(`📍 ${wh.name} (${wh.location.city})`);
      console.log(`   Materials: ${whMaterials.length}`);
      
      if (whMaterials.length > 0) {
        whMaterials.forEach(mat => {
          const percentage = mat.threshold > 0 
            ? Math.round((mat.quantity / mat.threshold) * 100) 
            : 100;
          const icon = mat.status === 'optimal' ? '✅' : '⚠️';
          console.log(`   ${icon} ${mat.name}: ${mat.quantity}/${mat.threshold} (${percentage}%)`);
        });
      }
      console.log('');
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ INTEGRATION CHECK COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('💡 TIP: Materials are now connected to warehouses by location.');
    console.log('   The Inventory Alert system will show materials from both:');
    console.log('   1. Existing Materials database (matched by warehouse city)');
    console.log('   2. New WarehouseMaterial records (added via Inventory Alerts page)\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkIntegration();
