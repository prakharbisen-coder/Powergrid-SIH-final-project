import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';
const ML_API_BASE_URL = 'http://localhost:8000';
const OPTIMIZATION_API_BASE_URL = 'http://localhost:8001';

// Get auth token from localStorage
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token;
};

// Create axios instance with auth interceptor
const createAxiosInstance = (baseURL: string) => {
  const instance = axios.create({ baseURL });
  
  instance.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  return instance;
};

const apiClient = createAxiosInstance(API_BASE_URL);
const mlClient = createAxiosInstance(ML_API_BASE_URL);
const optimizationClient = createAxiosInstance(OPTIMIZATION_API_BASE_URL);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  register: async (userData: any) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

// Project API
export const projectAPI = {
  getAll: async () => {
    const response = await apiClient.get('/projects');
    return response;
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/projects/${id}`);
    return response;
  },
  
  create: async (projectData: any) => {
    const response = await apiClient.post('/projects', projectData);
    return response;
  },
  
  update: async (id: string, projectData: any) => {
    const response = await apiClient.put(`/projects/${id}`, projectData);
    return response;
  },
  
  delete: async (id: string) => {
    const response = await apiClient.delete(`/projects/${id}`);
    return response;
  }
};

// Material API
export const materialAPI = {
  getAll: async () => {
    const response = await apiClient.get('/materials');
    return response;
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/materials/${id}`);
    return response;
  },
  
  create: async (materialData: any) => {
    const response = await apiClient.post('/materials', materialData);
    return response;
  },
  
  update: async (id: string, materialData: any) => {
    const response = await apiClient.put(`/materials/${id}`, materialData);
    return response;
  },
  
  delete: async (id: string) => {
    const response = await apiClient.delete(`/materials/${id}`);
    return response;
  },

  getByCategory: async () => {
    const response = await apiClient.get('/materials/by-category');
    return response;
  }
};

// Forecast API
export const forecastAPI = {
  create: async (forecastData: any) => {
    const response = await mlClient.post('/forecast', forecastData);
    return response.data;
  },
  
  predict: async (projectData: any) => {
    const response = await mlClient.post('/predict', projectData);
    return response.data;
  },
  
  generateMLForecast: async (projectId: string) => {
    const response = await apiClient.post('/forecasting/generate', { projectId });
    return response;
  },
  
  generateAdvancedForecast: async (projectId: string, materialId: string, forecastDays: number = 30, options?: any) => {
    const response = await apiClient.post('/forecasting/generate-advanced', { 
      projectId, 
      materialId, 
      forecastDays,
      ...options
    });
    return response;
  },
  
  checkMLStatus: async () => {
    const response = await apiClient.get('/forecasting/ml-status');
    return response;
  },
  
  getAll: async () => {
    const response = await apiClient.get('/forecasting');
    return response;
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/forecasting/${id}`);
    return response;
  }
};

// Budget API
export const budgetAPI = {
  getAll: async () => {
    const response = await apiClient.get('/budget');
    return response;
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/budget/${id}`);
    return response;
  },
  
  create: async (budgetData: any) => {
    const response = await apiClient.post('/budget', budgetData);
    return response;
  },
  
  update: async (id: string, budgetData: any) => {
    const response = await apiClient.put(`/budget/${id}`, budgetData);
    return response;
  }
};

// Analytics API
export const analyticsAPI = {
  getAll: async () => {
    const response = await apiClient.get('/analytics');
    return response;
  },
  
  getOverview: async () => {
    const response = await apiClient.get('/analytics/overview');
    return response;
  },
  
  getRegionalSummary: async () => {
    const response = await apiClient.get('/analytics/regional-summary');
    return response;
  },
  
  getMaterialTrends: async () => {
    const response = await apiClient.get('/analytics/material-trends');
    return response;
  },
  
  getBudgetAnalysis: async () => {
    const response = await apiClient.get('/analytics/budget-analysis');
    return response;
  }
};

// Alert API
export const alertAPI = {
  getAll: async () => {
    const response = await apiClient.get('/alerts');
    return response;
  },
  
  update: async (id: string, alertData: any) => {
    const response = await apiClient.patch(`/alerts/${id}`, alertData);
    return response;
  },

  markAsRead: async (id: string) => {
    const response = await apiClient.patch(`/alerts/${id}/read`);
    return response;
  }
};

// Procurement API
export const procurementAPI = {
  getAll: async () => {
    const response = await apiClient.get('/procurement');
    return response;
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/procurement/${id}`);
    return response;
  },
  
  create: async (procurementData: any) => {
    const response = await apiClient.post('/procurement', procurementData);
    return response;
  },
  
  update: async (id: string, procurementData: any) => {
    const response = await apiClient.put(`/procurement/${id}`, procurementData);
    return response;
  },
  
  calculateTax: async (taxData: any) => {
    const response = await apiClient.post('/procurement/calculate-tax', taxData);
    return response;
  }
};

// Vendor API
export const vendorAPI = {
  getAll: async (params?: any) => {
    const response = await apiClient.get('/vendors', { params });
    return response;
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/vendors/${id}`);
    return response;
  },
  
  create: async (vendorData: any) => {
    const response = await apiClient.post('/vendors', vendorData);
    return response;
  },
  
  update: async (id: string, vendorData: any) => {
    const response = await apiClient.put(`/vendors/${id}`, vendorData);
    return response;
  },
  
  getStats: async () => {
    const response = await apiClient.get('/vendors/stats');
    return response;
  }
};

// Warehouse API
export const warehouseAPI = {
  getAll: async () => {
    const response = await apiClient.get('/warehouse');
    return response;
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/warehouse/${id}`);
    return response;
  },
  
  updateStock: async (id: string, stockData: any) => {
    const response = await apiClient.put(`/warehouse/${id}/stock`, stockData);
    return response;
  }
};

// Inventory Alert API (Geospatial Warehouse Management)
export const inventoryAlertAPI = {
  getAllWarehouses: async () => {
    const response = await apiClient.get('/inventory/warehouses');
    return response.data;
  },
  
  getWarehouseMaterials: async (warehouseId: string) => {
    const response = await apiClient.get(`/inventory/materials/${warehouseId}`);
    return response.data;
  },
  
  addWarehouse: async (warehouseData: any) => {
    const response = await apiClient.post('/inventory/warehouse/add', warehouseData);
    return response.data;
  },
  
  addMaterial: async (materialData: any) => {
    const response = await apiClient.post('/inventory/material/add', materialData);
    return response.data;
  },
  
  updateMaterial: async (updateData: any) => {
    const response = await apiClient.post('/inventory/material/update', updateData);
    return response.data;
  },
  
  testAlert: async (warehouseId: string, materialName: string) => {
    const response = await apiClient.get(`/inventory/alert/test?warehouseId=${warehouseId}&materialName=${encodeURIComponent(materialName)}`);
    return response.data;
  },
  
  getAllAlerts: async () => {
    const response = await apiClient.get('/inventory/alert/all');
    return response.data;
  },
  
  runStockCheck: async () => {
    const response = await apiClient.get('/inventory/alert/run-check');
    return response.data;
  }
};

// Scenario API
export const scenarioAPI = {
  run: async (scenarioData: any) => {
    const response = await mlClient.post('/api/scenario/run', scenarioData);
    return response.data;
  },
  
  getAll: async () => {
    const response = await apiClient.get('/scenarios');
    return response;
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/scenarios/${id}`);
    return response;
  },
  
  create: async (scenarioData: any) => {
    const response = await apiClient.post('/scenarios', scenarioData);
    return response;
  },
  
  delete: async (id: string) => {
    const response = await apiClient.delete(`/scenarios/${id}`);
    return response;
  }
};

// BOQ API
export const boqAPI = {
  getAll: async () => {
    const response = await apiClient.get('/boq');
    return response;
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/boq/${id}`);
    return response;
  },
  
  getByProject: async (projectId: string) => {
    const response = await apiClient.get(`/boq/project/${projectId}`);
    return response;
  },
  
  create: async (boqData: any) => {
    const response = await apiClient.post('/boq', boqData);
    return response;
  },
  
  update: async (id: string, boqData: any) => {
    const response = await apiClient.put(`/boq/${id}`, boqData);
    return response;
  },
  
  addItem: async (projectId: string, itemData: any) => {
    const response = await apiClient.post(`/boq/${projectId}/item`, itemData);
    return response;
  },
  
  updateItem: async (projectId: string, itemId: string, itemData: any) => {
    const response = await apiClient.put(`/boq/${projectId}/item/${itemId}`, itemData);
    return response;
  },
  
  deleteItem: async (projectId: string, itemId: string) => {
    const response = await apiClient.delete(`/boq/${projectId}/item/${itemId}`);
    return response;
  },
  
  updateConsumption: async (projectId: string, itemId: string, consumedQuantity: number) => {
    const response = await apiClient.put(`/boq/${projectId}/item/${itemId}/consumption`, { consumedQuantity });
    return response;
  },
  
  approve: async (projectId: string) => {
    const response = await apiClient.put(`/boq/${projectId}/approve`);
    return response;
  }
};

// Optimization API
export const optimizationAPI = {
  getData: async () => {
    const response = await optimizationClient.get('/data');
    return response.data;
  },
  
  optimize: async (optimizationData: any) => {
    const response = await optimizationClient.post('/optimize', optimizationData);
    return response.data;
  },
  
  simulateBudgets: async (simulationData: any) => {
    const response = await optimizationClient.post('/simulate', simulationData);
    return response.data;
  },
  
  simulateVendorDown: async (simulationData: any) => {
    const response = await optimizationClient.post('/vendor_down', simulationData);
    return response.data;
  }
};

export default {
  auth: authAPI,
  projects: projectAPI,
  materials: materialAPI,
  forecasts: forecastAPI,
  budgets: budgetAPI,
  analytics: analyticsAPI,
  alerts: alertAPI,
  procurement: procurementAPI,
  vendors: vendorAPI,
  warehouse: warehouseAPI,
  inventoryAlert: inventoryAlertAPI,
  scenarios: scenarioAPI,
  boq: boqAPI,
  optimization: optimizationAPI
};
