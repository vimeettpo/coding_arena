import api from './api';

const contestService = {
  list: () => api.get('/contests').then((r) => r.data),
  getDetail: (id) => api.get(`/contests/${id}`).then((r) => r.data),
  register: (id) => api.post(`/contests/${id}/register`).then((r) => r.data),
  create: (payload) => api.post('/contests', payload).then((r) => r.data),
  getLeaderboard: (id) => api.get(`/contests/${id}/leaderboard`).then((r) => r.data),
};

export default contestService;
