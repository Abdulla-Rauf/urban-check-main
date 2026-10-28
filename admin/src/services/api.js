import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const adminApi = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Admin Request Interceptor: Attach dedicated admin token
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('urban_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Admin Response Interceptor
adminApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect or clear admin session
      localStorage.removeItem('urban_admin_token');
    }
    const message = error.response?.data?.message || error.message || 'Admin API error';
    return Promise.reject(new Error(message));
  }
);

export default adminApi;
