# Power Grid Backend API

A comprehensive backend API for the Power Grid Prediction Flow application, built with Node.js, Express, and MongoDB.

## Features

- 🔐 JWT-based authentication
- 👥 User management with role-based access control
- 📦 Material inventory management
- 💰 Budget tracking and optimization
- 📊 Forecasting and analytics
- 🚨 Alert system
- 🏭 Warehouse management
- 📝 Procurement order management
- 🎯 Scenario planning

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS
- **Validation**: express-validator

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

## Installation

1. **Clone the repository and navigate to backend folder**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

   Update the `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/powergrid
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRE=7d
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Start MongoDB**
   
   If using local MongoDB:
   ```bash
   mongod
   ```

   Or use MongoDB Atlas (cloud) by updating the `MONGODB_URI` in `.env`

5. **Run the server**

   Development mode with auto-reload:
   ```bash
   npm run dev
   ```

   Production mode:
   ```bash
   npm start
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user | Private |

### Users

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users` | Get all users | Admin/Manager |
| GET | `/api/users/:id` | Get single user | Private |
| PUT | `/api/users/:id` | Update user | Private |
| DELETE | `/api/users/:id` | Delete user | Admin |

### Materials

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/materials` | Get all materials | Private |
| GET | `/api/materials/:id` | Get single material | Private |
| GET | `/api/materials/low-stock` | Get low stock materials | Private |
| POST | `/api/materials` | Create material | Private |
| PUT | `/api/materials/:id` | Update material | Private |
| DELETE | `/api/materials/:id` | Delete material | Admin/Manager |

### Budget

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/budget` | Get all budgets | Private |
| GET | `/api/budget/:id` | Get single budget | Private |
| POST | `/api/budget` | Create budget | Admin/Manager |
| PUT | `/api/budget/:id` | Update budget | Admin/Manager |
| POST | `/api/budget/:id/transaction` | Add transaction | Private |
| DELETE | `/api/budget/:id` | Delete budget | Admin |

### Forecasting

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/forecasting` | Get all forecasts | Private |
| GET | `/api/forecasting/:id` | Get single forecast | Private |
| POST | `/api/forecasting` | Create forecast | Private |
| PUT | `/api/forecasting/:id` | Update forecast | Private |
| DELETE | `/api/forecasting/:id` | Delete forecast | Private |

### Alerts

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/alerts` | Get all alerts | Private |
| GET | `/api/alerts/:id` | Get single alert | Private |
| POST | `/api/alerts` | Create alert | Private |
| PUT | `/api/alerts/:id` | Update alert | Private |
| PUT | `/api/alerts/:id/acknowledge` | Acknowledge alert | Private |
| PUT | `/api/alerts/:id/resolve` | Resolve alert | Private |
| DELETE | `/api/alerts/:id` | Delete alert | Admin/Manager |

### Scenarios

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/scenarios` | Get all scenarios | Private |
| GET | `/api/scenarios/:id` | Get single scenario | Private |
| POST | `/api/scenarios` | Create scenario | Private |
| PUT | `/api/scenarios/:id` | Update scenario | Private (Owner) |
| DELETE | `/api/scenarios/:id` | Delete scenario | Private (Owner) |

### Analytics

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/analytics` | Get all analytics | Private |
| GET | `/api/analytics/:id` | Get single analytics | Private |
| GET | `/api/analytics/summary/region` | Get regional summary | Private |
| POST | `/api/analytics` | Create analytics | Private |
| DELETE | `/api/analytics/:id` | Delete analytics | Admin |

### Warehouse

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/warehouse` | Get all warehouses | Private |
| GET | `/api/warehouse/:id` | Get single warehouse | Private |
| POST | `/api/warehouse` | Create warehouse | Admin/Manager |
| PUT | `/api/warehouse/:id` | Update warehouse | Admin/Manager |
| POST | `/api/warehouse/:id/inventory` | Add inventory | Private |
| DELETE | `/api/warehouse/:id` | Delete warehouse | Admin |

### Procurement

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/procurement` | Get all orders | Private |
| GET | `/api/procurement/:id` | Get single order | Private |
| POST | `/api/procurement` | Create order | Private |
| PUT | `/api/procurement/:id` | Update order | Private |
| PUT | `/api/procurement/:id/approve` | Approve order | Admin/Manager |
| DELETE | `/api/procurement/:id` | Delete order | Private |

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Example: Register & Login

**Register:**
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user",
  "department": "operations"
}
```

**Login:**
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5f484f8d2e31234567890",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "department": "operations"
  }
}
```

## Data Models

### User
- name, email, password
- role: user, admin, manager
- department: procurement, operations, finance, analytics, admin

### Material
- materialId, name, category
- quantity, threshold, status
- location, reusable quantity
- price, supplier

### Budget
- category, allocated, spent, projected
- status, fiscalYear
- transactions array

### Forecast
- project, material, duration
- forecastData array
- insights, accuracy

### Alert
- type: critical, warning, info, success
- title, message, category
- status, priority
- related entity references

### Scenario
- name, description, type
- parameters, results
- creator and shared users

### Warehouse
- warehouseId, name, location
- capacity, inventory array
- manager, status

### Procurement
- poNumber, material reference
- quantity, vendor details
- pricing breakdown
- status, priority, dates

### Analytics
- region, period
- metrics (demand, fulfillment, efficiency)
- material breakdown
- performance indicators

## Error Handling

All API responses follow this format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error message here"
}
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Helmet for security headers
- CORS configuration
- Request validation

## Development

**Run in development mode:**
```bash
npm run dev
```

This uses nodemon to auto-restart the server on file changes.

## Project Structure

```
backend/
├── config/
│   └── db.js              # Database connection
├── controllers/           # Request handlers
│   ├── authController.js
│   ├── userController.js
│   ├── materialController.js
│   ├── budgetController.js
│   ├── forecastController.js
│   ├── alertController.js
│   ├── scenarioController.js
│   ├── analyticsController.js
│   ├── warehouseController.js
│   └── procurementController.js
├── middleware/
│   └── auth.js            # Authentication middleware
├── models/                # Mongoose schemas
│   ├── User.js
│   ├── Material.js
│   ├── Budget.js
│   ├── Forecast.js
│   ├── Alert.js
│   ├── Scenario.js
│   ├── Analytics.js
│   ├── Warehouse.js
│   └── Procurement.js
├── routes/                # API routes
│   ├── auth.js
│   ├── users.js
│   ├── materials.js
│   ├── budget.js
│   ├── forecasting.js
│   ├── alerts.js
│   ├── scenarios.js
│   ├── analytics.js
│   ├── warehouse.js
│   └── procurement.js
├── .env.example           # Environment variables template
├── .gitignore
├── package.json
└── server.js              # Application entry point
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/powergrid |
| JWT_SECRET | Secret key for JWT | Required |
| JWT_EXPIRE | JWT expiration time | 7d |
| CORS_ORIGIN | Allowed CORS origin | http://localhost:5173 |

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
