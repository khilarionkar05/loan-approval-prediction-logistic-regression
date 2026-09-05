const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export const API_ENDPOINTS = {
  predict: `${API_BASE_URL}/predict`,
  analytics: `${API_BASE_URL}/analytics-data`,
  trainingData: `${API_BASE_URL}/training-data`,
};
