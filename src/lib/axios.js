// src/lib/axios.js
import axios from 'axios';

// Create an Axios instance with your backend's base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Pointing to your Node.js backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Automatically attach the JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;