const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Models
const User = require('./models/User');
const Material = require('./models/Material');
const Budget = require('./models/Budget');
const Alert = require('./models/Alert');
const Forecast = require('./models/Forecast');

// Connect to DB
mongoose.connect(process.env.MONGODB_URI);

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Material.deleteMany();
    await Budget.deleteMany();
    await Alert.deleteMany();
    await Forecast.deleteMany();

    console.log('Cleared existing data...');

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@powergrid.com',
      password: 'admin123',
      role: 'admin',
      department: 'admin'
    });

    // Create regular user
    const regularUser = await User.create({
      name: 'John Doe',
      email: 'john@powergrid.com',
      password: 'user123',
      role: 'user',
      department: 'operations'
    });

    console.log('Created users...');

    // Create sample materials
    const materials = await Material.create([
      {
        materialId: 'MAT-001',
        name: 'Angle Steel 150x150x12mm',
        category: 'Steel',
        subCategory: 'Angle Steel',
        quantity: 2450,
        threshold: 1500,
        unit: 'MT',
        location: 'Delhi Warehouse',
        price: 55000,
        supplier: 'Tata Steel',
        specifications: {
          grade: 'IS 2062 E250',
          thickness: 12,
          length: 12000,
          width: 150,
          weight: 26.8
        }
      },
      {
        materialId: 'MAT-002',
        name: 'ACSR Conductor Panther',
        category: 'Conductors',
        subCategory: 'ACSR Conductors',
        quantity: 18500,
        threshold: 15000,
        unit: 'KM',
        location: 'Mumbai Warehouse',
        price: 2850,
        supplier: 'Sterlite Power',
        specifications: {
          conductor_size: '403mm²',
          stranding: '54/3.18mm',
          breaking_strength: 12500,
          resistance: 0.0717
        }
      },
      {
        materialId: 'MAT-003',
        name: 'Disc Insulator 160kN',
        category: 'Insulators',
        subCategory: 'Disc Insulators',
        quantity: 8950,
        threshold: 5000,
        unit: 'NOS',
        location: 'Bangalore Warehouse',
        price: 450,
        supplier: 'NGK Insulators',
        specifications: {
          voltage_rating: '400kV',
          creepage_distance: 320,
          mechanical_strength: 160
        }
      },
      {
        materialId: 'MAT-004',
        name: 'OPC 53 Grade Cement',
        category: 'Cement',
        subCategory: 'OPC 53 Grade',
        quantity: 5600,
        threshold: 8000,
        unit: 'Bags',
        location: 'Kolkata Warehouse',
        price: 420,
        supplier: 'UltraTech Cement',
        specifications: {
          cement_grade: 'OPC 53',
          bag_weight: 50,
          compressive_strength: 53
        }
      },
      {
        materialId: 'MAT-005',
        name: 'Foundation Bolts M24x800',
        category: 'Nuts/Bolts',
        subCategory: 'Foundation Bolts',
        quantity: 12500,
        threshold: 8000,
        unit: 'NOS',
        location: 'Chennai Warehouse',
        price: 85,
        supplier: 'Sundram Fasteners',
        specifications: {
          diameter: 24,
          bolt_length: 800,
          material_grade: '8.8',
          thread_type: 'Metric Coarse'
        }
      },
      {
        materialId: 'MAT-006',
        name: 'Earth Rods 16mm x 3m',
        category: 'Earthing',
        subCategory: 'Earth Rods',
        quantity: 3200,
        threshold: 2000,
        unit: 'NOS',
        location: 'Hyderabad Warehouse',
        price: 650,
        supplier: 'Erico India',
        specifications: {
          rod_diameter: 16,
          rod_length: 3000,
          material_type: 'Copper Bonded',
          resistance_value: 5
        }
      }
    ]);

    console.log('Created materials...');

    // Create sample budgets
    const budgets = await Budget.create([
      {
        category: 'Towers',
        allocated: 450000000,
        spent: 389000000,
        fiscalYear: '2024-2025',
        department: 'operations',
        transactions: [
          { date: new Date('2024-11-01'), amount: 45000000, type: 'expense', description: 'Tower steel procurement' },
          { date: new Date('2024-11-15'), amount: 38000000, type: 'expense', description: 'Tower fabrication' }
        ]
      },
      {
        category: 'Conductors',
        allocated: 320000000,
        spent: 245000000,
        fiscalYear: '2024-2025',
        department: 'operations',
        transactions: [
          { date: new Date('2024-10-20'), amount: 125000000, type: 'expense', description: 'ACSR Conductor bulk order' },
          { date: new Date('2024-11-05'), amount: 120000000, type: 'expense', description: 'AAC Conductor procurement' }
        ]
      },
      {
        category: 'Substations',
        allocated: 280000000,
        spent: 142000000,
        fiscalYear: '2024-2025',
        department: 'operations',
        transactions: [
          { date: new Date('2024-10-10'), amount: 85000000, type: 'expense', description: 'Substation equipment' },
          { date: new Date('2024-11-20'), amount: 57000000, type: 'expense', description: 'Composite Insulator procurement' }
        ]
      },
      {
        category: 'Transformers',
        allocated: 195000000,
        spent: 78000000,
        fiscalYear: '2024-2025',
        department: 'operations',
        transactions: [
          { date: new Date('2024-09-15'), amount: 45000000, type: 'expense', description: 'Power transformer 132kV' },
          { date: new Date('2024-10-25'), amount: 33000000, type: 'expense', description: 'Distribution transformers' }
        ]
      }
    ]);

    console.log('Created budgets...');

    // Create sample alerts
    const alerts = await Alert.create([
      {
        type: 'critical',
        title: 'Low Stock Alert',
        message: 'OPC 53 Grade Cement stock (5600 bags) below threshold (8000 bags). Reorder recommended.',
        category: 'stock',
        status: 'active',
        priority: 5,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        type: 'warning',
        title: 'Budget Utilization Alert',
        message: 'Towers category budget utilization at 86.4%. Monitor spending closely.',
        category: 'budget',
        status: 'active',
        priority: 4,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
      },
      {
        type: 'warning',
        title: 'Vendor Delivery Delay',
        message: 'Sterlite Power conductor delivery delayed by 3 days. Expected on Dec 12.',
        category: 'vendor',
        status: 'active',
        priority: 3,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        type: 'info',
        title: 'Price Increase Alert',
        message: 'Steel prices increased by 4.2% this quarter. Budget adjustment may be needed.',
        category: 'budget',
        status: 'acknowledged',
        priority: 2,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000) // 2 days ago
      }
    ]);

    console.log('Created alerts...');

    // Create sample forecasts
    const forecasts = await Forecast.create([
      {
        project: 'Northern Grid Expansion',
        material: 'Angle Steel',
        duration: 30,
        accuracy: 98.4,
        status: 'active',
        forecastData: [
          { day: '1', demand: 12500, forecast: 12300, supply: 12450 },
          { day: '7', demand: 13200, forecast: 13450, supply: 13300 },
          { day: '14', demand: 14100, forecast: 13890, supply: 14000 }
        ],
        createdAt: new Date('2024-09-01')
      },
      {
        project: 'Western Grid Upgrade',
        material: 'ACSR Conductor',
        duration: 45,
        accuracy: 95.2,
        status: 'active',
        forecastData: [
          { day: '1', demand: 15200, forecast: 15100, supply: 15300 },
          { day: '15', demand: 16500, forecast: 16200, supply: 16400 },
          { day: '30', demand: 17200, forecast: 17350, supply: 17300 }
        ],
        createdAt: new Date('2024-10-01')
      },
      {
        project: 'Southern Substation Network',
        material: 'Disc Insulator',
        duration: 60,
        accuracy: 92.8,
        status: 'active',
        forecastData: [
          { day: '1', demand: 8500, forecast: 8300, supply: 8600 },
          { day: '20', demand: 9200, forecast: 9450, supply: 9300 },
          { day: '40', demand: 10100, forecast: 9890, supply: 10000 }
        ],
        createdAt: new Date('2024-11-01')
      },
      {
        project: 'Eastern Grid Modernization',
        material: 'OPC 53 Cement',
        duration: 30,
        accuracy: 89.5,
        status: 'completed',
        forecastData: [
          { day: '1', demand: 5200, forecast: 5100, supply: 5300 },
          { day: '15', demand: 5500, forecast: 5650, supply: 5600 }
        ],
        createdAt: new Date('2024-12-01')
      }
    ]);

    console.log('Created forecasts...');

    console.log('✅ Database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@powergrid.com / admin123');
    console.log('User: john@powergrid.com / user123');
    console.log('\nDashboard Data:');
    console.log(`- Materials: ${materials.length}`);
    console.log(`- Budgets: ${budgets.length}`);
    console.log(`- Alerts: ${alerts.length}`);
    console.log(`- Forecasts: ${forecasts.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
