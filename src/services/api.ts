import axios from 'axios';
import { store } from '../store';
import { logoutUser } from '../store/slices/authSlice';
import { clearPersistedQueryCache, queryClient } from '@/lib/queryClient';

// Determine the base URL based on environment
// For production, it will look for VITE_API_URL, then fallback to a generic api subdomain or relative path.
const getBaseUrl = () => {
  return import.meta.env.VITE_API_URL || '';
};

export const BACKEND_URL = getBaseUrl().replace(/\/api$/, '');

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // Important for sending/receiving cookies
});

const requestStartedAt = new WeakMap<object, number>();
const normalizeApiPath = (url = '') => url
  .split('?')[0]
  .replace(/\/[a-f\d]{24}(?=\/|$)/gi, '/:id')
  .replace(/\/\d+(?=\/|$)/g, '/:number');
const logClientTiming = (config: object & { url?: string; method?: string }, status?: number) => {
  const startedAt = requestStartedAt.get(config);
  if (startedAt === undefined) return;
  requestStartedAt.delete(config);
  const durationMs = Math.round(performance.now() - startedAt);
  const logAll = import.meta.env.DEV && import.meta.env.VITE_API_PERFORMANCE_LOG === 'true';
  if (!logAll && durationMs < 500) return;
  console.info('[ApiPerformance]', {
    method: config.method?.toUpperCase(),
    route: normalizeApiPath(config.url),
    status,
    durationMs,
  });
};

api.interceptors.request.use((config) => {
  requestStartedAt.set(config, performance.now());
  return config;
});

// Response Interceptor to handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => {
    logClientTiming(response.config, response.status);
    const method = response.config.method?.toLowerCase();
    const url = response.config.url || '';
    if (
      method && ['post', 'put', 'patch', 'delete'].includes(method)
      && /^\/(leads|customers|companies)(\/|$)/.test(url)
    ) {
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'metrics'] });
      void queryClient.invalidateQueries({ queryKey: ['leads', 'stats'] });
    }
    return response;
  },
  (error) => {
    if (error.config) logClientTiming(error.config, error.response?.status);
    if (error.response && error.response.status === 401) {
      // Dispatch logout action to clear state
      clearPersistedQueryCache();
      store.dispatch(logoutUser());
    }
    return Promise.reject(error);
  }
);

export default api;
