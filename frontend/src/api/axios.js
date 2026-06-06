import axios from 'axios';

// In development, Vite proxies /api requests to your backend on port 80
// In production (Docker), requests go directly to the Nginx gateway
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost',
  timeout: 15000,
});

// REQUEST interceptor — attach JWT token to every outgoing request
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

// RESPONSE interceptor — handle 401 globally
// If ANY request gets a 401, clear the token and redirect to login
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

export default api;