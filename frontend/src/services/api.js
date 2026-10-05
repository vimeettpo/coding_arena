import axios from 'axios';

// Central Axios instance. Every feature service imports this instead of
// calling axios directly, so auth headers, base URL and error handling
// stay in one place.
const rawBaseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const sanitizeBaseURL = (url) => {
  if (!url) return '/api';
  let cleaned = url.replace(/\/+$/, '');
  if (!cleaned.endsWith('/api')) {
    cleaned += '/api';
  }
  return cleaned;
};

const api = axios.create({
  baseURL: sanitizeBaseURL(rawBaseURL),
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
        const { data } = await axios.post(
          `${sanitizeBaseURL(rawBaseURL)}/auth/refresh`,
          { refreshToken }
        );
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
