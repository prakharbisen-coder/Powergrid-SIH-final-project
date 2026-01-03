const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Call ML service for material demand prediction
 */
const predictMaterialDemand = async (projectData) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, {
      project_name: projectData.name,
      tower_count: projectData.infrastructure.towerCount,
      voltage: projectData.infrastructure.voltage,
      tower_type: projectData.infrastructure.towerType,
      terrain: projectData.location.terrain,
      region: projectData.location.region,
      project_duration_months: calculateDuration(projectData.timeline.startDate, projectData.timeline.endDate)
    });
    
    return response.data;
  } catch (error) {
    console.error('ML Service Error:', error.message);
    throw new Error('Failed to get ML predictions');
  }
};

/**
 * Batch prediction for multiple projects
 */
const batchPredictMaterialDemand = async (projects) => {
  try {
    const inputs = projects.map(project => ({
      project_name: project.name,
      tower_count: project.infrastructure.towerCount,
      voltage: project.infrastructure.voltage,
      tower_type: project.infrastructure.towerType,
      terrain: project.location.terrain,
      region: project.location.region,
      project_duration_months: calculateDuration(project.timeline.startDate, project.timeline.endDate)
    }));
    
    const response = await axios.post(`${ML_SERVICE_URL}/batch-predict`, inputs);
    return response.data;
  } catch (error) {
    console.error('ML Service Batch Error:', error.message);
    throw new Error('Failed to get batch ML predictions');
  }
};

/**
 * Check ML service health
 */
const checkMLServiceHealth = async () => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`);
    return response.data;
  } catch (error) {
    return { status: 'offline', error: error.message };
  }
};

/**
 * Get ML model information
 */
const getModelInfo = async () => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/model-info`);
    return response.data;
  } catch (error) {
    console.error('Failed to get model info:', error.message);
    return null;
  }
};

/**
 * Calculate project duration in months
 */
const calculateDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return months;
};

module.exports = {
  predictMaterialDemand,
  batchPredictMaterialDemand,
  checkMLServiceHealth,
  getModelInfo
};
