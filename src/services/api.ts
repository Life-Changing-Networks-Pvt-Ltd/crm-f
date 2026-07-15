import axios from 'axios';
import { store } from '../store';
import { logoutUser } from '../store/slices/authSlice';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
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
