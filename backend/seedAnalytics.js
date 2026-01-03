const mongoose = require('mongoose');
const Analytics = require('./models/Analytics');
const User = require('./models/User');
require('dotenv').config();

const seedAnalytics = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/powergrid');
    console.log('MongoDB Connected...');

    // Clear existing analytics
    await Analytics.deleteMany();
    console.log('Existing analytics cleared');

    // Get admin user
    const adminUser = await User.findOne({ email: 'admin@powergrid.com' });
    if (!adminUser) {
      console.error('Admin user not found. Please run seed.js first.');
      process.exit(1);
    }

    const regions = ['Delhi NCR', 'Maharashtra', 'Gujarat', 'Karnataka', 'UP', 'Rajasthan'];
    const analyticsData = [];

    // Generate analytics for last 12 months
    const currentDate = new Date();
    
    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
      const startDate = new Date(currentDate);
      startDate.setMonth(startDate.getMonth() - monthOffset);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);

      for (const region of regions) {
        // Generate realistic metrics with variation
        const baseMultiplier = regions.indexOf(region) === 0 ? 1.2 : 
                              regions.indexOf(region) === regions.length - 1 ? 0.8 : 1.0;
        const timeDecay = 1 - (monthOffset * 0.05); // Older data shows growth
        
        const demand = Math.round((300 + Math.random() * 200) * baseMultiplier * timeDecay);
        const fulfillment = Math.round(80 + Math.random() * 18);
        const efficiency = Math.round(78 + Math.random() * 20);
        
        const allocated = Math.round((demand * 1500) + (Math.random() * 100000));
        const spent = Math.round(allocated * (0.85 + Math.random() * 0.12));
        
        analyticsData.push({
          region,
          period: {
            startDate,
            endDate
          },
          metrics: {
            demand,
            fulfillment,
            efficiency,
            costPerUnit: Math.round(1200 + Math.random() * 300),
            averageDeliveryTime: Math.round(10 + Math.random() * 8)
          },
          materialBreakdown: [
            { 
              material: 'Steel Towers', 
              quantity: Math.round(demand * 0.25), 
              value: Math.round(spent * 0.30) 
            },
            { 
              material: 'Conductors', 
              quantity: Math.round(demand * 0.20), 
              value: Math.round(spent * 0.25) 
            },
            { 
              material: 'Insulators', 
              quantity: Math.round(demand * 0.15), 
              value: Math.round(spent * 0.15) 
            },
            { 
              material: 'Transformers', 
              quantity: Math.round(demand * 0.10), 
              value: Math.round(spent * 0.20) 
            },
            { 
              material: 'Others', 
              quantity: Math.round(demand * 0.30), 
              value: Math.round(spent * 0.10) 
            }
          ],
          budgetAnalysis: {
            allocated,
            spent,
            variance: allocated - spent,
            utilizationPercent: Math.round((spent / allocated) * 100)
          },
          performanceIndicators: {
            onTimeDelivery: Math.round(85 + Math.random() * 12),
            stockAccuracy: Math.round(88 + Math.random() * 10),
            forecastAccuracy: Math.round(90 + Math.random() * 8),
            supplierPerformance: Math.round(86 + Math.random() * 11)
          },
          trends: [
            { date: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000), value: demand * 0.2, metric: 'demand' },
            { date: new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000), value: demand * 0.5, metric: 'demand' },
            { date: new Date(startDate.getTime() + 21 * 24 * 60 * 60 * 1000), value: demand * 0.8, metric: 'demand' },
            { date: endDate, value: demand, metric: 'demand' }
          ],
          generatedBy: adminUser._id
        });
      }
    }

    // Insert all analytics records
    await Analytics.insertMany(analyticsData);
    console.log(`✓ Created ${analyticsData.length} analytics records`);
    console.log(`✓ Regions: ${regions.join(', ')}`);
    console.log(`✓ Time period: Last 12 months`);

    mongoose.connection.close();
    console.log('Database seeding completed!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedAnalytics();
