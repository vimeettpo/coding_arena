import api from './api';

const authService = {
  login: (credentials) => api.post('/auth/login', credentials).then((r) => r.data),

  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),


  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (payload) => api.post('/auth/reset-password', payload).then((r) => r.data),

  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }).then((r) => r.data),

  me: () => api.get('/auth/me').then((r) => r.data),

  logout: () => api.post('/auth/logout').then((r) => r.data),
};

export default authService;
