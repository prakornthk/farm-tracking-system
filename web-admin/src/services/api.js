import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - เติม token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
};

// Farms
export const farmsAPI = {
  list: () => api.get('/farms'),
  get: (id) => api.get(`/farms/${id}`),
  create: (data) => api.post('/farms', data),
  update: (id, data) => api.put(`/farms/${id}`, data),
  delete: (id) => api.delete(`/farms/${id}`),
};

// Zones
export const zonesAPI = {
  list: (farmId) => api.get(`/farms/${farmId}/zones`),
  get: (farmId, id) => api.get(`/farms/${farmId}/zones/${id}`),
  create: (farmId, data) => api.post(`/farms/${farmId}/zones`, data),
  update: (farmId, id, data) => api.put(`/farms/${farmId}/zones/${id}`, data),
  delete: (farmId, id) => api.delete(`/farms/${farmId}/zones/${id}`),
};

// Plots
export const plotsAPI = {
  list: (zoneId) => api.get(`/zones/${zoneId}/plots`),
  get: (zoneId, id) => api.get(`/zones/${zoneId}/plots/${id}`),
  create: (zoneId, data) => api.post(`/zones/${zoneId}/plots`, data),
  update: (zoneId, id, data) => api.put(`/zones/${zoneId}/plots/${id}`, data),
  delete: (zoneId, id) => api.delete(`/zones/${zoneId}/plots/${id}`),
  getQR: (zoneId, id) => api.get(`/zones/${zoneId}/plots/${id}/qr`),
};

// Plants
export const plantsAPI = {
  list: (plotId) => api.get(`/plots/${plotId}/plants`),
  get: (plotId, id) => api.get(`/plots/${plotId}/plants/${id}`),
  create: (plotId, data) => api.post(`/plots/${plotId}/plants`, data),
  update: (plotId, id, data) => api.put(`/plots/${plotId}/plants/${id}`, data),
  delete: (plotId, id) => api.delete(`/plots/${plotId}/plants/${id}`),
};

// Tasks
export const tasksAPI = {
  list: (params) => api.get('/tasks', { params }),
  get: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  assign: (id, userId) => api.post(`/tasks/${id}/assign`, { user_id: userId }),
  complete: (id) => api.post(`/tasks/${id}/complete`),
};

// Problems
export const problemsAPI = {
  list: (params) => api.get('/problem-reports', { params }),
  get: (id) => api.get(`/problem-reports/${id}`),
  create: (data) => api.post('/problem-reports', data),
  update: (id, data) => api.put(`/problem-reports/${id}`, data),
  delete: (id) => api.delete(`/problem-reports/${id}`),
};

// Users
export const usersAPI = {
  list: () => api.get('/users'),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Dashboard
export const dashboardAPI = {
  metrics: (params) => api.get('/dashboard/metrics', { params }),
  todayStats: () => api.get('/dashboard/today'),
};

export default api;
