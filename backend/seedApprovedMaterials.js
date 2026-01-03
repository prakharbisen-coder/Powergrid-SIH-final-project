/**
 * SEED POWERGRID APPROVED MATERIALS
 * Populates database with PowerGrid-approved materials
 * 
 * This script imports materials that have been:
 * - Approved by PowerGrid technical committee
 * - Certified to IS/IEC standards
 * - Pre-negotiated with authorized vendors
 * - Used in actual transmission line projects
 * 
 * Categories included:
 * - Tower Parts (lattice tower components)
 * - Conductors (ACSR, AAAC types)
 * - Insulators (disc, post, polymer)
 * - Hardware (bolts, clamps, fittings)
 * - Circuit Breakers (SF6, vacuum, air blast)
 * - Transformers (power, distribution)
 * - Steel Structures (tower angles, plates)
 * - Foundation Materials (concrete, rebar)
 * - Earthing Materials (electrodes, conductors)
 * - Protection Equipment (arresters, relays)
 * - Cables (control, power)
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ApprovedMaterial = require('./models/ApprovedMaterial');

// Load environment variables
dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/powergrid', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// PowerGrid Approved Materials Data
const approvedMaterials = [
  // TOWER PARTS
  {
    materialName: 'Tower Bolt M16',
    category: 'Tower Parts',
    specifications: {
      standard: 'IS 1367',
      grade: '8.8',
      diameter: '16mm',
      length: '50-200mm',
      material: 'High Tensile Steel',
      finish: 'Hot Dip Galvanized'
    },
    standardCode: 'IS-1367-M16-8.8',
    unit: 'PCS',
    description: 'High tensile bolt for tower assembly, hot dip galvanized as per IS 1367'
  },
  {
    materialName: 'Tower Leg Angle 150x150x18',
    category: 'Tower Parts',
    specifications: {
      standard: 'IS 2062',
      grade: 'E250',
      size: '150x150x18mm',
      material: 'Structural Steel',
      coating: 'Galvanized'
    },
    standardCode: 'IS-2062-E250-150x150x18',
    unit: 'MTR',
    description: 'Main leg angle for transmission towers'
  },
  {
    materialName: 'Cross Arm Angle 110x110x10',
    category: 'Tower Parts',
    specifications: {
      standard: 'IS 2062',
      grade: 'E250',
      size: '110x110x10mm'
    },
    standardCode: 'IS-2062-E250-110x110x10',
    unit: 'MTR',
    description: 'Cross arm angle for conductor support'
  },

  // CONDUCTORS
  {
    materialName: 'ACSR Conductor Moose',
    category: 'Conductors',
    specifications: {
      standard: 'IEC 61089',
      codeWord: 'Moose',
      aluminiumArea: '506.7 sq.mm',
      steelArea: '56.3 sq.mm',
      overallDiameter: '27.74mm',
      breakingLoad: '13600 kg',
      ratedStrength: '133.4 kN'
    },
    standardCode: 'IEC-61089-MOOSE',
    unit: 'MTR',
    description: 'ACSR Moose conductor for 220kV transmission lines'
  },
  {
    materialName: 'ACSR Conductor Dog',
    category: 'Conductors',
    specifications: {
      standard: 'IEC 61089',
      codeWord: 'Dog',
      aluminiumArea: '201.4 sq.mm',
      steelArea: '22.4 sq.mm',
      overallDiameter: '17.50mm'
    },
    standardCode: 'IEC-61089-DOG',
    unit: 'MTR',
    description: 'ACSR Dog conductor for 132kV lines'
  },
  {
    materialName: 'AAAC Conductor Hazel',
    category: 'Conductors',
    specifications: {
      standard: 'IEC 61089',
      codeWord: 'Hazel',
      area: '132.8 sq.mm',
      diameter: '13.00mm',
      material: 'All Aluminium Alloy'
    },
    standardCode: 'IEC-61089-HAZEL',
    unit: 'MTR',
    description: 'AAAC Hazel conductor for coastal areas'
  },

  // INSULATORS
  {
    materialName: 'Disc Insulator 160kN',
    category: 'Insulators',
    specifications: {
      standard: 'IEC 60305',
      type: 'Suspension',
      mechanicalStrength: '160kN',
      spacing: '146mm',
      diameter: '280mm',
      material: 'Toughened Glass'
    },
    standardCode: 'IEC-60305-160kN',
    unit: 'PCS',
    description: 'Toughened glass disc insulator for 220kV lines'
  },
  {
    materialName: 'Polymer Long Rod Insulator 220kV',
    category: 'Insulators',
    specifications: {
      standard: 'IEC 61109',
      voltage: '220kV',
      creepageDistance: '5300mm',
      mechanicalLoad: '120kN',
      material: 'Silicone Rubber'
    },
    standardCode: 'IEC-61109-220kV',
    unit: 'PCS',
    description: 'Polymer insulator for pollution areas'
  },
  {
    materialName: 'Post Insulator 33kV',
    category: 'Insulators',
    specifications: {
      standard: 'IS 2046',
      voltage: '33kV',
      type: 'Station Post',
      material: 'Porcelain'
    },
    standardCode: 'IS-2046-33kV',
    unit: 'PCS',
    description: 'Porcelain post insulator for substations'
  },

  // HARDWARE
  {
    materialName: 'Suspension Clamp PG Type',
    category: 'Hardware',
    specifications: {
      standard: 'IS 5992',
      type: 'PG Clamp',
      conductorSize: 'Moose',
      material: 'Forged Steel',
      finish: 'Hot Dip Galvanized'
    },
    standardCode: 'IS-5992-PG-MOOSE',
    unit: 'PCS',
    description: 'PG type suspension clamp for Moose conductor'
  },
  {
    materialName: 'Tension Clamp Bolted Type',
    category: 'Hardware',
    specifications: {
      standard: 'IS 5983',
      type: 'Bolted Tension',
      conductorSize: 'Dog',
      material: 'Aluminum Alloy'
    },
    standardCode: 'IS-5983-DOG',
    unit: 'PCS',
    description: 'Bolted tension clamp for dead end'
  },
  {
    materialName: 'Spacer Damper Quad Bundle',
    category: 'Hardware',
    specifications: {
      standard: 'IEC 61284',
      bundleConfiguration: 'Quad',
      conductorSize: 'Moose',
      subSpan: '50-100m'
    },
    standardCode: 'IEC-61284-QUAD',
    unit: 'PCS',
    description: 'Spacer damper for quad bundle conductor'
  },

  // CIRCUIT BREAKERS
  {
    materialName: 'SF6 Circuit Breaker 220kV',
    category: 'Circuit Breakers',
    specifications: {
      standard: 'IEC 62271-100',
      voltage: '220kV',
      current: '2000A',
      breakingCapacity: '40kA',
      mechanism: 'Spring Operated',
      gas: 'SF6'
    },
    standardCode: 'IEC-62271-100-220kV',
    unit: 'SET',
    description: 'SF6 circuit breaker for 220kV substations'
  },
  {
    materialName: 'Vacuum Circuit Breaker 33kV',
    category: 'Circuit Breakers',
    specifications: {
      standard: 'IEC 62271-100',
      voltage: '33kV',
      current: '1250A',
      breakingCapacity: '25kA',
      mechanism: 'Vacuum Interrupter'
    },
    standardCode: 'IEC-62271-100-33kV',
    unit: 'SET',
    description: 'Vacuum circuit breaker for distribution'
  },

  // TRANSFORMERS
  {
    materialName: 'Power Transformer 100MVA 220/132kV',
    category: 'Transformers',
    specifications: {
      standard: 'IEC 60076',
      rating: '100MVA',
      voltage: '220/132kV',
      cooling: 'ONAN/ONAF',
      tapChanger: 'OLTC',
      impedance: '12-15%'
    },
    standardCode: 'IEC-60076-100MVA',
    unit: 'SET',
    description: 'Power transformer with OLTC'
  },
  {
    materialName: 'Distribution Transformer 1000kVA 33/11kV',
    category: 'Transformers',
    specifications: {
      standard: 'IS 1180',
      rating: '1000kVA',
      voltage: '33/11kV',
      cooling: 'ONAN',
      tapChanger: 'OLTC'
    },
    standardCode: 'IS-1180-1000kVA',
    unit: 'SET',
    description: 'Distribution transformer 1000kVA'
  },

  // STEEL STRUCTURES
  {
    materialName: 'Steel Angle 90x90x8',
    category: 'Steel Structures',
    specifications: {
      standard: 'IS 2062',
      grade: 'E250',
      size: '90x90x8mm',
      yield: '250 N/mm²'
    },
    standardCode: 'IS-2062-E250-90x90x8',
    unit: 'MTR',
    description: 'Steel angle for tower bracing'
  },
  {
    materialName: 'Steel Plate 12mm',
    category: 'Steel Structures',
    specifications: {
      standard: 'IS 2062',
      grade: 'E250',
      thickness: '12mm',
      width: '1000-2500mm'
    },
    standardCode: 'IS-2062-E250-12MM',
    unit: 'KG',
    description: 'Steel plate for gusset plates'
  },

  // FOUNDATION MATERIALS
  {
    materialName: 'Portland Cement OPC 53 Grade',
    category: 'Foundation Materials',
    specifications: {
      standard: 'IS 12269',
      grade: '53',
      type: 'OPC',
      compressiveStrength: '53 MPa'
    },
    standardCode: 'IS-12269-OPC53',
    unit: 'BAG',
    description: 'OPC 53 grade cement for tower foundations'
  },
  {
    materialName: 'TMT Rebar 25mm Fe500',
    category: 'Foundation Materials',
    specifications: {
      standard: 'IS 1786',
      grade: 'Fe500',
      diameter: '25mm',
      yield: '500 N/mm²'
    },
    standardCode: 'IS-1786-FE500-25MM',
    unit: 'KG',
    description: 'TMT reinforcement bars for concrete'
  },

  // EARTHING MATERIALS
  {
    materialName: 'Copper Earth Rod 16mm x 3m',
    category: 'Earthing Materials',
    specifications: {
      standard: 'IS 3043',
      diameter: '16mm',
      length: '3000mm',
      material: 'Copper Bonded Steel'
    },
    standardCode: 'IS-3043-16MM-3M',
    unit: 'PCS',
    description: 'Copper bonded earth rod'
  },
  {
    materialName: 'GI Strip 50x6mm',
    category: 'Earthing Materials',
    specifications: {
      standard: 'IS 2629',
      size: '50x6mm',
      material: 'Galvanized Iron',
      coating: ''
    },
    standardCode: 'IS-2629-50X6',
    unit: 'KG',
    description: 'GI strip for earthing conductor'
  },

  // PROTECTION EQUIPMENT
  {
    materialName: 'Lightning Arrester 220kV',
    category: 'Protection Equipment',
    specifications: {
      standard: 'IEC 60099-4',
      voltage: '220kV',
      mcov: '176kV',
      type: 'Metal Oxide',
      housingMaterial: 'Polymer'
    },
    standardCode: 'IEC-60099-4-220kV',
    unit: 'PCS',
    description: 'Polymer housed lightning arrester'
  },
  {
    materialName: 'Numerical Relay Distance Protection',
    category: 'Protection Equipment',
    specifications: {
      standard: 'IEC 60255',
      type: 'Distance Protection',
      zones: '4 Zones',
      communication: 'IEC 61850'
    },
    standardCode: 'IEC-60255-DIST',
    unit: 'PCS',
    description: 'Numerical distance relay'
  },

  // CABLES
  {
    materialName: 'XLPE Cable 33kV 3C x 300 sq.mm',
    category: 'Cables',
    specifications: {
      standard: 'IS 7098',
      voltage: '33kV',
      cores: '3',
      size: '300 sq.mm',
      insulation: 'XLPE'
    },
    standardCode: 'IS-7098-33kV-3CX300',
    unit: 'MTR',
    description: 'XLPE insulated power cable'
  },
  {
    materialName: 'Control Cable 1.5 sq.mm 10 Core',
    category: 'Cables',
    specifications: {
      standard: 'IS 1554',
      cores: '10',
      size: '1.5 sq.mm',
      voltage: '1100V',
      insulation: 'PVC'
    },
    standardCode: 'IS-1554-1.5SQ-10C',
    unit: 'MTR',
    description: 'Multi-core control cable for switchyard'
  }
];

// Seed function
const seedApprovedMaterials = async () => {
  try {
    await connectDB();

    // Clear existing approved materials
    console.log('\n🗑️  Clearing existing approved materials...');
    await ApprovedMaterial.deleteMany({});
    console.log('✅ Cleared');

    // Insert approved materials
    console.log('\n📦 Inserting approved materials...');
    for (const material of approvedMaterials) {
      const newMaterial = new ApprovedMaterial({
        ...material,
        isActive: true,
        approvalDate: new Date()
      });
      await newMaterial.save();
      console.log(`   ✅ ${material.materialName}`);
    }

    console.log(`\n✅ Successfully seeded ${approvedMaterials.length} approved materials`);
    
    // Show category breakdown
    const categories = {};
    approvedMaterials.forEach(m => {
      categories[m.category] = (categories[m.category] || 0) + 1;
    });
    
    console.log('\n📊 Category Breakdown:');
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} items`);
    });

    console.log('\n✅ Database seeding complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding
seedApprovedMaterials();
