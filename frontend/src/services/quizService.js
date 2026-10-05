import api from './api';

const quizService = {
  list: () => api.get('/quizzes').then((r) => r.data),
  getDetail: (id) => api.get(`/quizzes/${id}`).then((r) => r.data),
  create: (payload) => api.post('/quizzes', payload).then((r) => r.data),
  submit: (id, payload) => api.post(`/quizzes/${id}/submit`, payload).then((r) => r.data),
  getResult: (id) => api.get(`/quizzes/${id}/result`).then((r) => r.data),
  delete: (id) => api.delete(`/quizzes/${id}`).then((r) => r.data),
  getLeaderboard: (id) => api.get(`/quizzes/${id}/leaderboard`).then((r) => r.data),
};

export default quizService;
