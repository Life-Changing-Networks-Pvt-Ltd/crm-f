import axios from 'axios';
import { store } from '../store';
import { logoutUser } from '../store/slices/authSlice';

// Determine the base URL based on environment
// For production, it will look for VITE_API_URL, then fallback to a generic api subdomain or relative path.
const getBaseUrl = () => {
  return import.meta.env.VITE_API_URL || '';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // Important for sending/receiving cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response Interceptor to handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Dispatch logout action to clear state
      store.dispatch(logoutUser());
    }
    return Promise.reject(error);
  }
);

export default api;
