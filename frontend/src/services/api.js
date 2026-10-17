import axios from 'axios';

// Central Axios instance. Every feature service imports this instead of
// calling axios directly, so auth headers, base URL and error handling
// stay in one place.
const primaryBaseURL = import.meta.env.VITE_API_BASE_URL || 'https://coding-arena-topaz.vercel.app/api';
// A localhost fallback is only reachable during local development; in a
// deployed build it just produces a second, misleading network error.
const fallbackBaseURL = import.meta.env.DEV
  ? import.meta.env.VITE_API_FALLBACK_URL || 'http://localhost:8080/api'
  : null;

const sanitizeBaseURL = (url) => {
  if (!url) return '/api';
  let cleaned = url.replace(/\/+$/, '');
  if (!cleaned.endsWith('/api')) {
    cleaned += '/api';
  }
  return cleaned;
};

const primaryURL = sanitizeBaseURL(primaryBaseURL);
const fallbackURL = fallbackBaseURL ? sanitizeBaseURL(fallbackBaseURL) : null;

const api = axios.create({
  baseURL: primaryURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ca_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue = [];

const flushQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Use the local backend only when the hosted backend is unreachable or
    // returns a server error. Client errors indicate that the hosted backend
    // was reached and should not be retried against a different server.
    const canUseFallback =
      fallbackURL &&
      originalRequest &&
      !originalRequest._fallbackAttempt &&
      originalRequest.baseURL === primaryURL &&
      (!error.response || error.response.status >= 500);

    if (canUseFallback) {
      return api({
        ...originalRequest,
        baseURL: fallbackURL,
        _fallbackAttempt: true,
      });
    }

    // Access token expired — try the refresh-token flow once per request.
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem('ca_refresh_token');

      try {
        const { data } = await api.post('/auth/refresh', { refreshToken });
        const newAccessToken = data.data.accessToken;
        localStorage.setItem('ca_access_token', newAccessToken);
        flushQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        localStorage.removeItem('ca_access_token');
        localStorage.removeItem('ca_refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
