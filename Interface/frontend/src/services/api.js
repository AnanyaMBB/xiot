import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API service methods
export const apiService = {
  // System Status
  getSystemStatus: () => api.get('/status/'),

  // Baseboards
  getBaseboards: () => api.get('/baseboards/'),
  getBaseboard: (id) => api.get(`/baseboards/${id}/`),
  createBaseboard: (data) => api.post('/baseboards/', data),
  updateBaseboard: (id, data) => api.patch(`/baseboards/${id}/`, data),
  deleteBaseboard: (id) => api.delete(`/baseboards/${id}/`),

  // Sensors
  getSensors: (baseboardId) => api.get('/sensors/', { params: { baseboard: baseboardId } }),
  getSensor: (id) => api.get(`/sensors/${id}/`),
  updateSensor: (id, data) => api.patch(`/sensors/${id}/`, data),

  // Actuators
  getActuators: (baseboardId) => api.get('/actuators/', { params: { baseboard: baseboardId } }),
  getActuator: (id) => api.get(`/actuators/${id}/`),
  updateActuator: (id, data) => api.patch(`/actuators/${id}/`, data),
  sendActuatorCommand: (id, command) => api.post(`/actuators/${id}/command/`, command),
};

