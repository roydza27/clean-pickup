import axios from 'axios';

// API Base URL - configurable for different environments
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

console.log("Axios baseURL:", API_BASE_URL);

// Create axios instance with default config
export const api = axios.create({
  
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // support both token keys (safe migration)
    const token =
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // optional: prevent infinite redirect loops
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // <--- THIS TELLS YOU WHERE IT IS
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}); 

export default api;
