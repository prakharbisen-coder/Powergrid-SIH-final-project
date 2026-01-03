const mongoose = require('mongoose');
const Material = require('./models/Material');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const mats = await Material.find().limit(10);
  console.log('\nSample Material Locations:');
  console.log('─────────────────────────────────────');
  mats.forEach(m => {
    console.log(`${m.name}:`);
    console.log(`  Location: "${m.location}"`);
    console.log(`  Stock: ${m.quantity}/${m.threshold}`);
    console.log(`  Status: ${m.status}`);
    console.log('');
  });
  process.exit(0);
});
