import axios from 'axios';

let rawApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim();
if (rawApiUrl.endsWith('/')) rawApiUrl = rawApiUrl.slice(0, -1);
if (!rawApiUrl.endsWith('/api')) rawApiUrl = `${rawApiUrl}/api`;
const API_BASE_URL = rawApiUrl;

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token if available
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('queueless_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardize error extraction
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const customMessage =
      error.response?.data?.message ||
      (error.message === 'Network Error' ? 'Unable to connect to server. Please check your connection.' : error.message);

    const enhancedError = new Error(customMessage);
    enhancedError.status = error.response?.status;
    enhancedError.code = error.response?.data?.code;
    enhancedError.data = error.response?.data;

    return Promise.reject(enhancedError);
  }
);

export default axiosClient;
