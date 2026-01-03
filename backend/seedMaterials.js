const mongoose = require('mongoose');
const Material = require('./models/Material');
require('dotenv').config();

const sampleMaterials = [
  // Steel Materials
  {
    materialId: 'STL-001',
    name: 'Angle Steel 50x50x6mm',
    category: 'Steel',
    subCategory: 'Angle Steel',
    quantity: 5000,
    threshold: 1000,
    location: 'Warehouse A',
    unit: 'kg',
    price: 65,
    supplier: 'Tata Steel',
    specifications: {
      grade: 'IS 2062 E250',
      thickness: 6,
      length: 6000,
      width: 50,
      weight: 4.5
    },
    description: 'Angle steel for tower leg members'
  },
  {
    materialId: 'STL-002',
    name: 'Channel Steel ISMC 100',
    category: 'Steel',
    subCategory: 'Channel Steel',
    quantity: 3000,
    threshold: 800,
    location: 'Warehouse A',
    unit: 'kg',
    price: 70,
    supplier: 'SAIL',
    specifications: {
      grade: 'IS 2062',
      thickness: 7.5,
      length: 6000,
      weight: 9.2
    },
    description: 'Channel steel for bracing'
  },
  {
    materialId: 'STL-003',
    name: 'Galvanized Steel Plates',
    category: 'Steel',
    subCategory: 'Galvanized Steel',
    quantity: 2000,
    threshold: 500,
    location: 'Warehouse A',
    unit: 'kg',
    price: 85,
    supplier: 'JSW Steel',
    specifications: {
      grade: 'IS 2062',
      thickness: 10,
      length: 2400,
      width: 1200,
      weight: 226
    },
    description: 'Galvanized plates for tower base plates'
  },

  // Conductor Materials
  {
    materialId: 'COND-001',
    name: 'ACSR Zebra Conductor',
    category: 'Conductors',
    subCategory: 'ACSR Conductors',
    quantity: 50000,
    threshold: 10000,
    location: 'Warehouse B',
    unit: 'meters',
    price: 450,
    supplier: 'Sterlite Power',
    specifications: {
      conductor_size: '300 sq.mm',
      stranding: '54/7',
      breaking_strength: 10500,
      resistance: 0.0961
    },
    description: '400kV transmission line conductor'
  },
  {
    materialId: 'COND-002',
    name: 'AAC Panther Conductor',
    category: 'Conductors',
    subCategory: 'AAC Conductors',
    quantity: 30000,
    threshold: 8000,
    location: 'Warehouse B',
    unit: 'meters',
    price: 380,
    supplier: 'Apar Industries',
    specifications: {
      conductor_size: '200 sq.mm',
      stranding: '37',
      breaking_strength: 7800,
      resistance: 0.1428
    },
    description: '220kV transmission line conductor'
  },
  {
    materialId: 'COND-003',
    name: 'Optical Fiber Cable OPGW',
    category: 'Conductors',
    subCategory: 'Optical Fiber Cable',
    quantity: 20000,
    threshold: 5000,
    location: 'Warehouse B',
    unit: 'meters',
    price: 850,
    supplier: 'Finolex Cables',
    specifications: {
      conductor_size: '120 sq.mm',
      stranding: '24 fibers',
      breaking_strength: 12000
    },
    description: 'Optical ground wire with fiber'
  },

  // Insulator Materials
  {
    materialId: 'INS-001',
    name: 'Disc Insulator 160kN',
    category: 'Insulators',
    subCategory: 'Disc Insulators',
    quantity: 5000,
    threshold: 1000,
    location: 'Warehouse C',
    unit: 'pieces',
    price: 450,
    supplier: 'NGK Insulators',
    specifications: {
      voltage_rating: '400kV',
      creepage_distance: 320,
      mechanical_strength: 160
    },
    description: 'Porcelain disc insulators for 400kV lines'
  },
  {
    materialId: 'INS-002',
    name: 'Polymer Long Rod Insulator',
    category: 'Insulators',
    subCategory: 'Composite Insulators',
    quantity: 3000,
    threshold: 700,
    location: 'Warehouse C',
    unit: 'pieces',
    price: 3500,
    supplier: 'Hubbell Power',
    specifications: {
      voltage_rating: '765kV',
      creepage_distance: 9500,
      mechanical_strength: 210
    },
    description: 'Polymer composite insulator for UHV lines'
  },
  {
    materialId: 'INS-003',
    name: 'Suspension Insulator String',
    category: 'Insulators',
    subCategory: 'Suspension Insulators',
    quantity: 2000,
    threshold: 500,
    location: 'Warehouse C',
    unit: 'sets',
    price: 6500,
    supplier: 'Lapp Insulators',
    specifications: {
      voltage_rating: '220kV',
      creepage_distance: 280,
      mechanical_strength: 120
    },
    description: 'Complete suspension insulator string'
  },

  // Cement Materials
  {
    materialId: 'CEM-001',
    name: 'OPC 53 Grade Cement',
    category: 'Cement',
    subCategory: 'OPC 53 Grade',
    quantity: 10000,
    threshold: 2000,
    location: 'Warehouse D',
    unit: 'bags',
    price: 420,
    supplier: 'UltraTech Cement',
    specifications: {
      cement_grade: '53 Grade',
      bag_weight: 50,
      compressive_strength: 53
    },
    description: 'Ordinary Portland Cement for tower foundations'
  },
  {
    materialId: 'CEM-002',
    name: 'OPC 43 Grade Cement',
    category: 'Cement',
    subCategory: 'OPC 43 Grade',
    quantity: 8000,
    threshold: 1500,
    location: 'Warehouse D',
    unit: 'bags',
    price: 380,
    supplier: 'ACC Limited',
    specifications: {
      cement_grade: '43 Grade',
      bag_weight: 50,
      compressive_strength: 43
    },
    description: 'General purpose cement for foundations'
  },
  {
    materialId: 'CEM-003',
    name: 'Ready Mix Concrete M30',
    category: 'Cement',
    subCategory: 'Ready Mix Concrete',
    quantity: 500,
    threshold: 100,
    location: 'Warehouse D',
    unit: 'cubic meters',
    price: 5500,
    supplier: 'L&T Ready Mix',
    specifications: {
      cement_grade: 'M30',
      compressive_strength: 30
    },
    description: 'Ready mix concrete for tower bases'
  },

  // Nuts/Bolts Materials
  {
    materialId: 'NB-001',
    name: 'Foundation Bolts M24x500',
    category: 'Nuts/Bolts',
    subCategory: 'Foundation Bolts',
    quantity: 20000,
    threshold: 5000,
    location: 'Warehouse E',
    unit: 'pieces',
    price: 85,
    supplier: 'Sundaram Fasteners',
    specifications: {
      diameter: 24,
      bolt_length: 500,
      material_grade: 'Grade 8.8',
      thread_type: 'ISO Metric'
    },
    description: 'Foundation anchor bolts for towers'
  },
  {
    materialId: 'NB-002',
    name: 'Tower Bolts M16x100',
    category: 'Nuts/Bolts',
    subCategory: 'Tower Bolts',
    quantity: 50000,
    threshold: 10000,
    location: 'Warehouse E',
    unit: 'pieces',
    price: 25,
    supplier: 'Sundaram Fasteners',
    specifications: {
      diameter: 16,
      bolt_length: 100,
      material_grade: 'Grade 8.8',
      thread_type: 'ISO Metric'
    },
    description: 'Tower member connection bolts'
  },
  {
    materialId: 'NB-003',
    name: 'HT Bolts M20x150',
    category: 'Nuts/Bolts',
    subCategory: 'HT Bolts',
    quantity: 30000,
    threshold: 8000,
    location: 'Warehouse E',
    unit: 'pieces',
    price: 45,
    supplier: 'Sundaram Fasteners',
    specifications: {
      diameter: 20,
      bolt_length: 150,
      material_grade: 'Grade 10.9',
      thread_type: 'ISO Metric'
    },
    description: 'High tensile bolts for critical joints'
  },

  // Earthing Materials
  {
    materialId: 'ERTH-001',
    name: 'Copper Earth Rods 16mm x 3m',
    category: 'Earthing',
    subCategory: 'Earth Rods',
    quantity: 2000,
    threshold: 500,
    location: 'Warehouse F',
    unit: 'pieces',
    price: 1200,
    supplier: 'Erico',
    specifications: {
      rod_diameter: 16,
      rod_length: 3000,
      material_type: 'Copper Bonded',
      resistance_value: 5
    },
    description: 'Copper bonded earth rods for tower earthing'
  },
  {
    materialId: 'ERTH-002',
    name: 'GI Earth Strip 50x6mm',
    category: 'Earthing',
    subCategory: 'GI Strip',
    quantity: 10000,
    threshold: 2000,
    location: 'Warehouse F',
    unit: 'meters',
    price: 85,
    supplier: 'Tata Steel',
    specifications: {
      thickness: 6,
      width: 50,
      material_type: 'Galvanized Iron'
    },
    description: 'Galvanized strip for earth grid'
  },
  {
    materialId: 'ERTH-003',
    name: 'Chemical Earthing Electrode',
    category: 'Earthing',
    subCategory: 'Chemical Earthing',
    quantity: 500,
    threshold: 100,
    location: 'Warehouse F',
    unit: 'sets',
    price: 3500,
    supplier: 'Erico',
    specifications: {
      rod_diameter: 50,
      rod_length: 3000,
      material_type: 'Copper with Salt',
      resistance_value: 2
    },
    description: 'Chemical earthing complete sets'
  }
];

async function seedMaterials() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');

    // Clear existing materials (optional)
    console.log('Clearing existing materials...');
    await Material.deleteMany({});

    // Insert sample materials
    console.log('Inserting sample materials...');
    const materials = await Material.insertMany(sampleMaterials);
    console.log(`${materials.length} materials inserted successfully!`);

    // Display summary
    const categories = await Material.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$quantity', '$price'] } }
        }
      }
    ]);

    console.log('\n=== Material Summary by Category ===');
    categories.forEach(cat => {
      console.log(`${cat._id}: ${cat.count} materials, Total Value: ₹${cat.totalValue.toLocaleString()}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding materials:', error);
    process.exit(1);
  }
}

seedMaterials();
