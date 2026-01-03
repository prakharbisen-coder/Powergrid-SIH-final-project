"""
Data Generator for Budget Optimization
Generates realistic vendor and material data for testing
"""
import json
import random
from datetime import datetime

def generate_vendors(count=200):
    """Generate realistic vendor data with pricing, reliability, and lead times"""
    vendors = []
    
    # Material categories for power grid projects
    material_types = [
        "Steel", "Conductors", "Insulators", "Transformers", 
        "Towers", "Cables", "Earthing", "Hardware", "Switchgear", "Others"
    ]
    
    # Indian cities for vendor locations
    cities = [
        "Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", 
        "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
        "Chandigarh", "Indore", "Coimbatore", "Nagpur", "Surat"
    ]
    
    for i in range(1, count + 1):
        vendor_id = f"VEN-OPT-{i:04d}"
        
        # Random material specialization (1-3 materials per vendor)
        specializations = random.sample(material_types, random.randint(1, 3))
        
        # Generate price ranges based on material type
        prices = {}
        for material in specializations:
            # Base price varies by material type
            if material in ["Transformers", "Switchgear"]:
                base_price = random.uniform(50000, 200000)
            elif material in ["Towers", "Steel"]:
                base_price = random.uniform(10000, 50000)
            else:
                base_price = random.uniform(1000, 20000)
            
            prices[material] = round(base_price, 2)
        
        # Reliability score (0-100, with normal distribution around 85)
        reliability = max(50, min(100, random.gauss(85, 10)))
        
        # Lead time (5-30 days, with most vendors around 10-15 days)
        lead_time = max(5, min(30, int(random.gauss(12, 5))))
        
        # Capacity (how much they can supply)
        capacity = random.randint(100, 5000)
        
        # Availability (95% vendors available, 5% unavailable)
        available = random.random() > 0.05
        
        vendor = {
            "vendor_id": vendor_id,
            "vendor_name": f"Vendor {i}",
            "company_name": f"{random.choice(['Power', 'Energy', 'Grid', 'Electric', 'Tech'])} {random.choice(['Industries', 'Solutions', 'Systems', 'Engineering', 'Corp'])} Ltd",
            "location": random.choice(cities),
            "specializations": specializations,
            "prices": prices,
            "reliability_score": round(reliability, 2),
            "lead_time_days": lead_time,
            "capacity": capacity,
            "available": available,
            "payment_terms": random.choice(["15-days", "30-days", "45-days", "60-days"]),
            "rating": round(random.uniform(3.5, 5.0), 1),
            "total_orders": random.randint(10, 500)
        }
        
        vendors.append(vendor)
    
    return vendors

def generate_materials(count=5):
    """Generate material requirements for optimization"""
    materials = [
        {
            "material_id": "MAT-001",
            "material_name": "Steel Towers",
            "category": "Towers",
            "required_quantity": 50,
            "unit": "units",
            "urgency": "high",
            "description": "Transmission tower structures"
        },
        {
            "material_id": "MAT-002",
            "material_name": "ACSR Conductors",
            "category": "Conductors",
            "required_quantity": 5000,
            "unit": "meters",
            "urgency": "high",
            "description": "Aluminum conductor steel reinforced"
        },
        {
            "material_id": "MAT-003",
            "material_name": "Porcelain Insulators",
            "category": "Insulators",
            "required_quantity": 200,
            "unit": "units",
            "urgency": "medium",
            "description": "High voltage insulators"
        },
        {
            "material_id": "MAT-004",
            "material_name": "Power Transformers",
            "category": "Transformers",
            "required_quantity": 10,
            "unit": "units",
            "urgency": "high",
            "description": "Distribution transformers 100 KVA"
        },
        {
            "material_id": "MAT-005",
            "material_name": "Earthing Materials",
            "category": "Earthing",
            "required_quantity": 100,
            "unit": "sets",
            "urgency": "medium",
            "description": "Earthing rods and accessories"
        }
    ]
    
    return materials[:count]

def save_data():
    """Generate and save vendor and material data"""
    print("🔄 Generating vendor data...")
    vendors = generate_vendors(200)
    
    print("🔄 Generating material data...")
    materials = generate_materials(5)
    
    # Save to JSON files
    with open('data/vendors.json', 'w') as f:
        json.dump(vendors, f, indent=2)
    print(f"✅ Generated {len(vendors)} vendors → data/vendors.json")
    
    with open('data/materials.json', 'w') as f:
        json.dump(materials, f, indent=2)
    print(f"✅ Generated {len(materials)} materials → data/materials.json")
    
    # Print summary
    print("\n📊 Data Summary:")
    print(f"   Total Vendors: {len(vendors)}")
    print(f"   Available Vendors: {sum(1 for v in vendors if v['available'])}")
    print(f"   Avg Reliability: {sum(v['reliability_score'] for v in vendors) / len(vendors):.2f}")
    print(f"   Avg Lead Time: {sum(v['lead_time_days'] for v in vendors) / len(vendors):.1f} days")
    print(f"   Total Materials: {len(materials)}")
    
if __name__ == "__main__":
    save_data()
