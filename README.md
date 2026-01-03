# PowerGrid Predict Flow - SIH Final Project

<div align="center">

**Intelligent Power Grid Management System with AI/ML Forecasting**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2016.0.0-brightgreen)](https://nodejs.org/)
[![Python Version](https://img.shields.io/badge/python-%3E%3D%203.8-blue)](https://www.python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.4%2B-green)](https://www.mongodb.com/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [ML Models](#-ml-models)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**PowerGrid Predict Flow** is a comprehensive enterprise-grade web application designed for electrical power grid infrastructure planning, material management, and predictive analytics. This Smart India Hackathon (SIH) final project combines advanced machine learning forecasting with real-time inventory management to optimize power grid project execution and resource allocation.

### Problem Statement

Power distribution companies face challenges in:
- Inefficient material procurement and inventory management
- Unpredictable project costs and budget overruns
- Lack of data-driven demand forecasting
- Poor vendor performance tracking
- Manual processes leading to delays and errors

### Our Solution

PowerGrid Predict Flow provides an integrated platform that:
- ✅ Predicts material demand using ML models
- ✅ Optimizes budget allocation with AI-driven insights
- ✅ Manages multi-warehouse inventory in real-time
- ✅ Automates procurement workflows
- ✅ Tracks vendor performance and recommends optimal suppliers
- ✅ Provides comprehensive analytics and alerts

---

## 🚀 Key Features

### 1. **AI/ML-Powered Forecasting**
- Material demand prediction using ensemble ML models
- Time-series forecasting with 85%+ accuracy
- Budget optimization algorithms
- Cost forecasting with historical data analysis
- Scenario simulation for what-if analysis

### 2. **Material & Inventory Management**
- Real-time inventory tracking across multiple warehouses
- Automated reorder alerts with smart thresholds
- BOQ (Bill of Quantities) management for projects
- Material validation system with approved catalogs
- Location-based material distribution

### 3. **Budget & Cost Optimization**
- Project budget tracking with variance analysis
- AI-driven budget recommendations
- Cost forecasting for upcoming projects
- Tax calculation engine (GST, IGST, CGST, SGST)
- Budget vs actual spend analytics

### 4. **Vendor Management**
- Vendor performance scoring system
- Multi-vendor comparison with recommendations
- Geographic distance-based vendor selection
- Delivery reliability tracking
- Price comparison and negotiation support

### 5. **Procurement Automation**
- Digital procurement order workflow
- Multi-level approval system
- Status tracking (Pending, Approved, In Transit, Delivered)
- Integration with inventory and budget systems
- Vendor notification via AWS SNS

### 6. **Analytics & Insights Dashboard**
- Real-time KPI monitoring
- Interactive charts and visualizations
- Historical trend analysis
- Geographic project mapping (India map integration)
- Custom report generation

### 7. **Alert & Notification System**
- Low inventory alerts
- Budget threshold notifications
- Project milestone reminders
- AWS SNS integration for push notifications
- Role-based alert routing

### 8. **AI Chatbot Assistant**
- Google Generative AI powered chatbot
- Natural language query support
- Project and inventory information retrieval
- Guided troubleshooting

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │        React + TypeScript Frontend (Vite)                │   │
│  │  - shadcn/ui Components  - Tailwind CSS                  │   │
│  │  - React Router  - Firebase Auth  - Context API          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS/REST API
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│  ┌────────────────────────────────────────────────────────┐     │
│  │           Node.js + Express Backend                    │     │
│  │  - RESTful API  - JWT Authentication                   │     │
│  │  - Business Logic  - Validation Middleware             │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
            ↕                      ↕                      ↕
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   ML SERVICE     │   │  OPTIMIZATION    │   │   AWS SNS        │
│   (Python/       │   │   SERVICE        │   │   (Alerts)       │
│    FastAPI)      │   │  (Python)        │   │                  │
│                  │   │                  │   │                  │
│ - Forecasting    │   │ - Vendor Match   │   │ - Push Notif.    │
│ - Budget Models  │   │ - Cost Optim.    │   │ - Email Alerts   │
│ - Scenario Sim.  │   │ - Data Gen.      │   │                  │
└──────────────────┘   └──────────────────┘   └──────────────────┘
            ↕
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              MongoDB Database                          │     │
│  │  Collections: Users, Projects, Materials, Budgets,    │     │
│  │  Forecasts, Warehouses, Procurement, Vendors, etc.    │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
┌─────────────┐
│   User      │
│  Actions    │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────────────────────┐
│              Frontend (React)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │Dashboard │  │Materials │  │Forecasting│  ...    │
│  └──────────┘  └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────┘
       │
       │ API Calls (axios)
       ↓
┌─────────────────────────────────────────────────────┐
│         Backend API (Express.js)                    │
│                                                      │
│  ┌──────────────┐     ┌──────────────┐            │
│  │ Auth         │────→│ Controllers   │            │
│  │ Middleware   │     │ - Material    │            │
│  └──────────────┘     │ - Budget      │            │
│                       │ - Forecast    │            │
│                       │ - Procurement │            │
│                       └───────┬───────┘            │
│                               │                     │
│  ┌──────────────┐    ┌───────▼────────┐           │
│  │   Services   │◄───│   Models       │           │
│  │ - ML Service │    │   (Mongoose)   │           │
│  │ - SNS Service│    └───────┬────────┘           │
│  │ - Tax Service│            │                     │
│  └──────┬───────┘            │                     │
└─────────┼────────────────────┼─────────────────────┘
          │                    │
          │                    ↓
          │            ┌──────────────┐
          │            │   MongoDB    │
          │            │   Database   │
          │            └──────────────┘
          │
          ↓
┌─────────────────────────────────────────┐
│      ML Service (FastAPI)               │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │  Trained Models                  │   │
│  │  - Demand Forecasting            │   │
│  │  - Budget Optimization           │   │
│  │  - Cost Prediction               │   │
│  └──────────────────────────────────┘   │
│                                          │
│  Endpoints:                              │
│  - POST /predict                         │
│  - POST /forecast                        │
│  - POST /simulate                        │
│  - POST /budget/optimize                 │
└─────────────────────────────────────────┘
```

### Module Interaction Flow

```
┌─────────────┐
│   LOGIN     │
│   MODULE    │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────────────┐
│          DASHBOARD                          │
│  - Real-time KPIs                           │
│  - Recent Activities                        │
│  - Quick Actions                            │
└─────┬───────────────────────────────────┬───┘
      │                                   │
      ↓                                   ↓
┌─────────────────┐            ┌─────────────────┐
│   PROJECTS      │            │   MATERIALS     │
│   MODULE        │            │   MODULE        │
│                 │            │                 │
│ - Create Project│            │ - Inventory     │
│ - Assign Budget │◄──────────►│ - BOQ Manager   │
│ - Track Progress│            │ - Reorder       │
└────────┬────────┘            └────────┬────────┘
         │                              │
         ↓                              ↓
┌─────────────────┐            ┌─────────────────┐
│  FORECASTING    │            │  PROCUREMENT    │
│  MODULE         │            │  MODULE         │
│                 │            │                 │
│ - ML Predictions│◄──────────►│ - Create Order  │
│ - Demand Trends │            │ - Vendor Select │
│ - Scenarios     │            │ - Approval Flow │
└────────┬────────┘            └────────┬────────┘
         │                              │
         ↓                              ↓
┌─────────────────┐            ┌─────────────────┐
│  BUDGET         │            │  WAREHOUSE      │
│  OPTIMIZATION   │            │  MODULE         │
│                 │            │                 │
│ - Cost Analysis │◄──────────►│ - Stock Levels  │
│ - AI Recommend. │            │ - Multi-location│
│ - Tax Calc.     │            │ - Alerts        │
└─────────────────┘            └─────────────────┘
         │                              │
         └──────────────┬───────────────┘
                        ↓
              ┌─────────────────┐
              │   ANALYTICS     │
              │   & REPORTS     │
              │                 │
              │ - Visualizations│
              │ - Export Data   │
              │ - Insights      │
              └─────────────────┘
```

---

## 💻 Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (Fast HMR and optimized builds)
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Context API + Hooks
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Authentication**: Firebase Auth
- **Forms**: React Hook Form + Zod validation

### Backend
- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: Helmet, CORS, bcrypt
- **Logging**: Morgan
- **Task Scheduling**: node-cron
- **Push Notifications**: AWS SDK (SNS)
- **File Processing**: csv-parser, csvtojson

### ML Service
- **Framework**: FastAPI (Python)
- **ML Libraries**: 
  - scikit-learn (ML models)
  - pandas (Data processing)
  - numpy (Numerical operations)
- **Models**: 
  - Random Forest, Gradient Boosting
  - Ensemble Stacking Models
  - Linear Regression variants
- **Serialization**: pickle
- **Server**: Uvicorn (ASGI)

### Optimization Service
- **Language**: Python 3.8+
- **Framework**: FastAPI
- **Libraries**: pandas, numpy, scikit-learn

### Infrastructure & DevOps
- **Version Control**: Git + GitHub (with Git LFS)
- **Cloud Services**: AWS SNS for notifications
- **Package Management**: npm (frontend), pip (Python)
- **API Testing**: Postman
- **Environment**: .env for configuration

---

## 📁 Project Structure

```
powergrid-predict-flow/
├── 📂 backend/                    # Node.js backend API
│   ├── 📂 config/                 # Database & config files
│   ├── 📂 controllers/            # Request handlers
│   ├── 📂 middleware/             # Auth & validation middleware
│   ├── 📂 models/                 # MongoDB schemas
│   ├── 📂 routes/                 # API endpoints
│   ├── 📂 services/               # Business logic services
│   ├── 📂 utils/                  # Helper functions
│   ├── 📂 ml-data-export/         # Training data exports
│   ├── 📄 server.js               # Express server entry
│   ├── 📄 package.json            # Dependencies
│   └── 📄 .env.example            # Environment template
│
├── 📂 ml-service/                 # Python ML service
│   ├── 📂 models/                 # Trained ML models
│   │   ├── 📂 budget_optimization/
│   │   ├── 📄 cement_model.pkl
│   │   ├── 📄 conductors_model.pkl
│   │   └── ...
│   ├── 📂 scenario/               # Scenario simulation
│   ├── 📄 main.py                 # FastAPI application
│   ├── 📄 forecasting_service.py  # Forecasting logic
│   ├── 📄 train_model.py          # Model training script
│   ├── 📄 requirements.txt        # Python dependencies
│   └── 📄 README.md               # ML service docs
│
├── 📂 optimization-service/       # Vendor optimization service
│   ├── 📂 data/                   # Sample data
│   ├── 📄 main.py                 # FastAPI app
│   └── 📄 requirements.txt
│
├── 📂 src/                        # React frontend source
│   ├── 📂 components/             # Reusable components
│   │   ├── 📂 ui/                 # shadcn/ui components
│   │   ├── 📄 AppSidebar.tsx
│   │   ├── 📄 VendorComparison.tsx
│   │   └── ...
│   ├── 📂 pages/                  # Route pages
│   │   ├── 📄 Dashboard.tsx
│   │   ├── 📄 Materials.tsx
│   │   ├── 📄 Forecasting.tsx
│   │   ├── 📄 BudgetOptimization.tsx
│   │   └── ...
│   ├── 📂 contexts/               # React contexts
│   ├── 📂 services/               # API services
│   ├── 📂 hooks/                  # Custom hooks
│   ├── 📄 App.tsx                 # Main app component
│   └── 📄 main.tsx                # Entry point
│
├── 📂 public/                     # Static assets
│   ├── 📄 india.geojson           # India map data
│   └── 📄 india-map.html
│
├── 📂 static/                     # Alternative static pages
│
├── 📄 package.json                # Frontend dependencies
├── 📄 vite.config.ts              # Vite configuration
├── 📄 tailwind.config.ts          # Tailwind configuration
├── 📄 tsconfig.json               # TypeScript config
├── 📄 start-all.ps1               # PowerShell start script
├── 📄 start-services.ps1          # Service startup script
└── 📄 README.md                   # This file
```

---

## 🚀 Installation & Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **Python** (3.8 or higher) - [Download](https://www.python.org/)
- **MongoDB** (v4.4+) - [Download](https://www.mongodb.com/) or use MongoDB Atlas
- **Git** - [Download](https://git-scm.com/)
- **Git LFS** - [Install](https://git-lfs.github.com/) (for large ML model files)

### Step 1: Clone the Repository

```bash
git clone https://github.com/prakharbisen-coder/Powergrid-SIH-final-project.git
cd Powergrid-SIH-final-project
```

### Step 2: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
copy .env.example .env

# Configure your .env file with:
# - MongoDB connection string
# - JWT secret
# - AWS credentials (for SNS)
# - Port configuration

# Seed the database with sample data
npm run seed

# Start the backend server
npm start
# Or for development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:5000`

### Step 3: ML Service Setup

```bash
cd ml-service

# Create a virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the ML service
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The ML service will run on `http://localhost:8000`

### Step 4: Optimization Service Setup (Optional)

```bash
cd optimization-service

# Install dependencies
pip install -r requirements.txt

# Start the service
uvicorn main:app --reload --port 8001
```

### Step 5: Frontend Setup

```bash
# From the root directory
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### Step 6: Quick Start All Services (Windows)

```powershell
# Run all services with a single command
.\start-all.ps1
```

---

## 📖 Usage

### 1. **Access the Application**

Open your browser and navigate to `http://localhost:5173`

### 2. **Login**

Use the default admin credentials (created during seeding):
- **Email**: admin@powergrid.com
- **Password**: admin123

### 3. **Explore Features**

#### Dashboard
- View real-time KPIs and metrics
- Monitor recent activities
- Quick access to key functions

#### Projects
- Create new power grid projects
- Assign budgets and resources
- Track project progress

#### Materials Management
- View inventory across all warehouses
- Create and manage BOQs
- Set reorder points and receive alerts

#### Forecasting
- Get AI-powered demand predictions
- Analyze historical trends
- Run scenario simulations

#### Budget Optimization
- Analyze project costs
- Get AI-driven budget recommendations
- Calculate taxes automatically

#### Procurement
- Create procurement orders
- Select vendors based on AI recommendations
- Track order status through approval workflow

#### Vendor Management
- Compare vendor performance
- View geographic distribution
- Analyze pricing and delivery metrics

#### Analytics
- Generate custom reports
- View interactive charts
- Export data for external analysis

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

All protected endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Main Endpoints

#### Authentication
```http
POST /api/auth/register       # Register new user
POST /api/auth/login          # Login
GET  /api/auth/me             # Get current user
```

#### Projects
```http
GET    /api/projects          # Get all projects
POST   /api/projects          # Create project
GET    /api/projects/:id      # Get single project
PUT    /api/projects/:id      # Update project
DELETE /api/projects/:id      # Delete project
```

#### Materials
```http
GET    /api/materials         # Get all materials
POST   /api/materials         # Add material
GET    /api/materials/:id     # Get material details
PUT    /api/materials/:id     # Update material
DELETE /api/materials/:id     # Delete material
```

#### Forecasting
```http
POST   /api/forecasting/predict      # Get ML predictions
GET    /api/forecasting/history      # Get forecast history
POST   /api/forecasting/scenario     # Run scenario simulation
```

#### Budget
```http
GET    /api/budget            # Get all budgets
POST   /api/budget            # Create budget
PUT    /api/budget/:id        # Update budget
GET    /api/budget/optimize   # Get AI optimization
```

#### Procurement
```http
GET    /api/procurement       # Get all orders
POST   /api/procurement       # Create order
PUT    /api/procurement/:id   # Update order status
```

#### Vendors
```http
GET    /api/vendors           # Get all vendors
POST   /api/vendors           # Add vendor
GET    /api/vendors/compare   # Compare vendors
```

For complete API documentation, import the Postman collection:
```
backend/PowerGrid_API.postman_collection.json
```

---

## 🤖 ML Models

### Forecasting Models

1. **Material Demand Prediction**
   - Algorithm: Ensemble (Random Forest + Gradient Boosting)
   - Features: Historical consumption, project size, location, season
   - Accuracy: ~87%

2. **Budget Optimization**
   - Algorithm: Stacking Classifier with Multiple Base Models
   - Features: Project type, materials, location, vendor prices
   - Optimization: Cost minimization with quality constraints

3. **Cost Forecasting**
   - Algorithm: Linear Regression with Feature Engineering
   - Features: Material costs, labor, overhead, inflation rates
   - Accuracy: ~82%

### Model Training

To retrain models with new data:

```bash
cd ml-service

# Export training data from MongoDB
cd ../backend
node extract-ml-data.js

# Train models
cd ../ml-service
python train_model.py
python train_budget_models.py
```

### Model Files

Models are stored using Git LFS due to large file sizes:
- `ensemble_stack_model.pkl` (530 MB)
- `stacking_final_model.pkl` (403 MB)
- `final_weighted_ensemble.pkl` (248 MB)
- Category-specific models in `ml-service/models/`

---

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/powergrid
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173

# AWS SNS (Optional)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
SNS_TOPIC_ARN=your_topic_arn
```

#### Frontend (Firebase - src/lib/firebase.ts)
```typescript
const firebaseConfig = {
  apiKey: "your_api_key",
  authDomain: "your_auth_domain",
  projectId: "your_project_id",
  // ... other config
};
```

---

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### ML Service Testing
```bash
cd ml-service

# Test forecasting endpoint
python test_forecast_direct.py

# Test scenario simulation
python test_scenario_direct.py

# Test budget models
python test_budget_models.py
```

---

## 🚢 Deployment

### Frontend Deployment

Build for production:
```bash
npm run build
```

Deploy the `dist/` folder to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

### Backend Deployment

Recommended platforms:
- Heroku
- AWS Elastic Beanstalk
- DigitalOcean App Platform
- Railway

### ML Service Deployment

Deploy using:
- AWS Lambda + API Gateway
- Docker containers on AWS ECS
- Google Cloud Run
- Heroku (with Python buildpack)

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- **Frontend**: Follow ESLint configuration
- **Backend**: Use Prettier for formatting
- **Python**: Follow PEP 8 guidelines

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

**Smart India Hackathon Final Project**

- Project Lead: [Prakhar Bisen]
- Development Team: [Team Members]
- Institution: [Your Institution]

---

## 🙏 Acknowledgments

- Smart India Hackathon organizing committee
- Open source libraries and frameworks used
- MongoDB for database support
- AWS for cloud services
- All contributors and supporters

---

## 📞 Support

For issues, questions, or contributions:

- **GitHub Issues**: [Create an issue](https://github.com/prakharbisen-coder/Powergrid-SIH-final-project/issues)
- **Email**: [Your Email]

---

<div align="center">

**Built with ❤️ for Smart India Hackathon 2024**

[⭐ Star this repo](https://github.com/prakharbisen-coder/Powergrid-SIH-final-project) | [🐛 Report Bug](https://github.com/prakharbisen-coder/Powergrid-SIH-final-project/issues) | [✨ Request Feature](https://github.com/prakharbisen-coder/Powergrid-SIH-final-project/issues)

</div>
