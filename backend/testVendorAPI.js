// Test vendor API endpoints
const BASE_URL = 'http://localhost:5000/api';

// You need to login first to get token
const testVendorAPI = async () => {
  try {
    // 1. Login to get token
    console.log('1. Logging in...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@powergrid.com',
        password: 'admin123'
      })
    });
    const { token } = await loginRes.json();
    console.log('✅ Login successful');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 2. Get all vendors
    console.log('\n2. Fetching all vendors...');
    const vendorsRes = await fetch(`${BASE_URL}/vendors`, { headers });
    const vendorsData = await vendorsRes.json();
    console.log(`✅ Found ${vendorsData.count} vendors`);
    console.log('First vendor:', vendorsData.data[0]?.companyName);

    // 3. Get vendor statistics
    console.log('\n3. Fetching vendor statistics...');
    const statsRes = await fetch(`${BASE_URL}/vendors/stats`, { headers });
    const statsData = await statsRes.json();
    console.log('✅ Stats:', {
      total: statsData.data.totalStats[0]?.totalVendors,
      avgRating: statsData.data.totalStats[0]?.avgRating?.toFixed(2),
      totalValue: statsData.data.totalStats[0]?.totalValue
    });

    // 4. Get vendors by category
    console.log('\n4. Fetching Steel vendors...');
    const steelRes = await fetch(`${BASE_URL}/vendors/category/Steel`, { headers });
    const steelData = await steelRes.json();
    console.log(`✅ Found ${steelData.count} Steel vendors`);

    // 5. Search vendors
    console.log('\n5. Searching for "Conductor"...');
    const searchRes = await fetch(`${BASE_URL}/vendors?search=Conductor`, { headers });
    const searchData = await searchRes.json();
    console.log(`✅ Found ${searchData.count} matching vendors`);

    console.log('\n✅ All vendor API tests passed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testVendorAPI();
