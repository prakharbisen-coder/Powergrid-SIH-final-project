const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const testLogin = async (email, password) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    console.log(`🔐 Testing login for: ${email}`);
    console.log(`🔑 Password: ${password}\n`);
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }
    
    console.log('✅ User found:', user.name);
    console.log('📧 Email:', user.email);
    console.log('🔐 Hashed password:', user.password.substring(0, 20) + '...');
    
    const isMatch = await user.comparePassword(password);
    
    if (isMatch) {
      console.log('\n✅ ✅ ✅ PASSWORD MATCH! Login should work!\n');
    } else {
      console.log('\n❌ ❌ ❌ PASSWORD MISMATCH! Login will fail!\n');
    }
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Test with admin credentials
testLogin('admin@powergrid.com', 'admin123');
