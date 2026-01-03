const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Vendor = require('./models/Vendor');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/powergrid');
    console.log('MongoDB Connected...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const vendors = [
  {
    name: 'Rajesh Kumar',
    companyName: 'Steel Power Industries Ltd',
    email: 'rajesh@steelpower.com',
    phone: '+91-9876543210',
    alternatePhone: '+91-9876543211',
    address: {
      street: '123 Industrial Area',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India'
    },
    gstin: '27ABCDE1234F1Z5',
    pan: 'ABCDE1234F',
    materialCategories: ['Steel', 'Towers', 'Hardware'],
    rating: 4.5,
    totalOrders: 45,
    totalValue: 2500000,
    status: 'active',
    paymentTerms: '30-days',
    bankDetails: {
      accountNumber: '1234567890',
      ifscCode: 'HDFC0001234',
      bankName: 'HDFC Bank',
      branch: 'Mumbai Main',
      accountHolderName: 'Steel Power Industries Ltd'
    },
    certifications: [
      {
        name: 'ISO 9001:2015',
        issuedBy: 'BSI Group',
        validTill: new Date('2025-12-31')
      }
    ],
    performanceMetrics: {
      onTimeDelivery: 92,
      qualityScore: 88,
      responseTime: 12
    },
    contactPerson: {
      name: 'Amit Shah',
      designation: 'Sales Manager',
      phone: '+91-9876543212',
      email: 'amit.shah@steelpower.com'
    },
    lastOrderDate: new Date('2024-11-15')
  },
  {
    name: 'Priya Sharma',
    companyName: 'Conductor Solutions Pvt Ltd',
    email: 'priya@conductorsolutions.com',
    phone: '+91-9876543220',
    address: {
      street: '45 Electronics City',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560100',
      country: 'India'
    },
    gstin: '29ABCDE5678G2Z5',
    pan: 'ABCDE5678G',
    materialCategories: ['Conductors', 'Cables'],
    rating: 4.8,
    totalOrders: 62,
    totalValue: 3800000,
    status: 'active',
    paymentTerms: '45-days',
    performanceMetrics: {
      onTimeDelivery: 95,
      qualityScore: 92,
      responseTime: 8
    },
    contactPerson: {
      name: 'Vikram Singh',
      designation: 'Business Head',
      phone: '+91-9876543221',
      email: 'vikram@conductorsolutions.com'
    },
    lastOrderDate: new Date('2024-12-01')
  },
  {
    name: 'Anil Verma',
    companyName: 'Insulator Tech India',
    email: 'anil@insulatortech.in',
    phone: '+91-9876543230',
    address: {
      street: '78 Industrial Park',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      country: 'India'
    },
    gstin: '07ABCDE9012H3Z5',
    pan: 'ABCDE9012H',
    materialCategories: ['Insulators'],
    rating: 4.2,
    totalOrders: 38,
    totalValue: 1900000,
    status: 'active',
    paymentTerms: '30-days',
    performanceMetrics: {
      onTimeDelivery: 85,
      qualityScore: 87,
      responseTime: 16
    },
    contactPerson: {
      name: 'Sunita Gupta',
      designation: 'Operations Manager',
      phone: '+91-9876543231',
      email: 'sunita@insulatortech.in'
    },
    lastOrderDate: new Date('2024-10-20')
  },
  {
    name: 'Sanjay Patel',
    companyName: 'Transformer Engineering Co',
    email: 'sanjay@transformereng.com',
    phone: '+91-9876543240',
    address: {
      street: '234 Power Zone',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380001',
      country: 'India'
    },
    gstin: '24ABCDE3456I4Z5',
    pan: 'ABCDE3456I',
    materialCategories: ['Transformers', 'Substations'],
    rating: 4.6,
    totalOrders: 28,
    totalValue: 5200000,
    status: 'active',
    paymentTerms: '60-days',
    performanceMetrics: {
      onTimeDelivery: 90,
      qualityScore: 94,
      responseTime: 24
    },
    contactPerson: {
      name: 'Meera Patel',
      designation: 'Technical Director',
      phone: '+91-9876543241',
      email: 'meera@transformereng.com'
    },
    lastOrderDate: new Date('2024-11-25')
  },
  {
    name: 'Ramesh Reddy',
    companyName: 'Earthing Systems Ltd',
    email: 'ramesh@earthingsystems.com',
    phone: '+91-9876543250',
    address: {
      street: '567 Tech Park',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500001',
      country: 'India'
    },
    gstin: '36ABCDE7890J5Z5',
    pan: 'ABCDE7890J',
    materialCategories: ['Earthing', 'Hardware'],
    rating: 4.0,
    totalOrders: 52,
    totalValue: 1500000,
    status: 'active',
    paymentTerms: '30-days',
    performanceMetrics: {
      onTimeDelivery: 82,
      qualityScore: 80,
      responseTime: 20
    },
    contactPerson: {
      name: 'Lakshmi Reddy',
      designation: 'Sales Head',
      phone: '+91-9876543251',
      email: 'lakshmi@earthingsystems.com'
    },
    lastOrderDate: new Date('2024-11-10')
  },
  {
    name: 'Vikas Joshi',
    companyName: 'Cable Network Solutions',
    email: 'vikas@cablenetwork.com',
    phone: '+91-9876543260',
    address: {
      street: '890 Industrial Belt',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      country: 'India'
    },
    gstin: '27ABCDE4567K6Z5',
    pan: 'ABCDE4567K',
    materialCategories: ['Cables', 'Conductors'],
    rating: 4.7,
    totalOrders: 71,
    totalValue: 4100000,
    status: 'active',
    paymentTerms: '45-days',
    performanceMetrics: {
      onTimeDelivery: 94,
      qualityScore: 91,
      responseTime: 10
    },
    contactPerson: {
      name: 'Neha Joshi',
      designation: 'General Manager',
      phone: '+91-9876543261',
      email: 'neha@cablenetwork.com'
    },
    lastOrderDate: new Date('2024-12-05')
  },
  {
    name: 'Suresh Iyer',
    companyName: 'Tower Fabrication Works',
    email: 'suresh@towerfab.com',
    phone: '+91-9876543270',
    address: {
      street: '123 Heavy Industry Area',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      country: 'India'
    },
    gstin: '33ABCDE8901L7Z5',
    pan: 'ABCDE8901L',
    materialCategories: ['Towers', 'Steel', 'Hardware'],
    rating: 3.8,
    totalOrders: 34,
    totalValue: 2800000,
    status: 'active',
    paymentTerms: '30-days',
    performanceMetrics: {
      onTimeDelivery: 78,
      qualityScore: 75,
      responseTime: 28
    },
    contactPerson: {
      name: 'Kavitha Iyer',
      designation: 'Project Manager',
      phone: '+91-9876543271',
      email: 'kavitha@towerfab.com'
    },
    lastOrderDate: new Date('2024-09-15')
  },
  {
    name: 'Deepak Singh',
    companyName: 'Quality Hardware Suppliers',
    email: 'deepak@qualityhardware.com',
    phone: '+91-9876543280',
    address: {
      street: '456 Market Road',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700001',
      country: 'India'
    },
    gstin: '19ABCDE2345M8Z5',
    pan: 'ABCDE2345M',
    materialCategories: ['Hardware', 'Others'],
    rating: 4.3,
    totalOrders: 89,
    totalValue: 950000,
    status: 'active',
    paymentTerms: '15-days',
    performanceMetrics: {
      onTimeDelivery: 88,
      qualityScore: 85,
      responseTime: 6
    },
    contactPerson: {
      name: 'Anjali Singh',
      designation: 'Logistics Head',
      phone: '+91-9876543281',
      email: 'anjali@qualityhardware.com'
    },
    lastOrderDate: new Date('2024-12-07')
  }
];

const seedVendors = async () => {
  try {
    await connectDB();

    // Clear existing vendors
    await Vendor.deleteMany({});
    console.log('Existing vendors deleted');

    // Insert vendors one by one to trigger pre-save middleware
    for (const vendorData of vendors) {
      await Vendor.create(vendorData);
    }
    
    console.log(`✅ ${vendors.length} vendors seeded successfully`);

    const allVendors = await Vendor.find();
    console.log('\nSeeded Vendors:');
    allVendors.forEach(v => {
      console.log(`  - ${v.vendorId}: ${v.companyName} (${v.status}) - Rating: ${v.rating}⭐`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding vendors:', error);
    process.exit(1);
  }
};

seedVendors();
