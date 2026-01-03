const mongoose = require('mongoose');
const Project = require('./models/Project');
require('dotenv').config();

async function testProject() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Count existing projects
    const count = await Project.countDocuments();
    console.log(`\n📊 Existing projects in database: ${count}`);

    // Create a test project
    const projectId = `PRJ-${Date.now()}`;
    const testProject = new Project({
      projectId: projectId,
      name: 'Test Transmission Line Project',
      description: 'Test project for database integration verification',
      location: {
        region: 'North',
        state: 'Delhi',
        terrain: 'Plain'
      },
      timeline: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'Planning'
      },
      budget: {
        total: 50000000, // 50 Crore
        allocated: 50000000,
        spent: 0,
        currency: 'INR',
        financialYear: '2024-25'
      },
      infrastructure: {
        towerType: '220kV Lattice',
        towerCount: 50,
        voltage: '220kV'
      },
      costs: {
        gst: 18,
        transportCost: 500000,
        stateTaxes: 300000
      }
    });

    const saved = await testProject.save();
    console.log('✅ Test project created successfully!');
    console.log(`\n📝 Project Details:`);
    console.log(`   - ID: ${saved._id}`);
    console.log(`   - Name: ${saved.name}`);
    console.log(`   - Location: ${saved.location.region} - ${saved.location.state}`);
    console.log(`   - Budget: ₹${(saved.budget.total / 10000000).toFixed(2)} Crore`);
    console.log(`   - Tower Count: ${saved.infrastructure.towerCount}`);
    console.log(`   - Voltage: ${saved.infrastructure.voltage}`);

    // Fetch all projects
    const allProjects = await Project.find();
    console.log(`\n📋 Total projects now: ${allProjects.length}`);

    mongoose.connection.close();
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testProject();
