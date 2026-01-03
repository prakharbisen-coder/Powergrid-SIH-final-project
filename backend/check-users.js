const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    const users = await User.find({});
    console.log(`\n📊 Total users in database: ${users.length}\n`);
    
    users.forEach(user => {
      console.log('👤 User:', {
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isActive: user.isActive
      });
    });
    
    if (users.length === 0) {
      console.log('\n⚠️  No users found! Run "npm run seed" to create users.');
    }
    
    mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
