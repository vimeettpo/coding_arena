import api from './api';

const problemService = {
  list: (params) => api.get('/problems', { params }).then((r) => r.data),
  getBySlug: (slug) => api.get(`/problems/${slug}`).then((r) => r.data),
  compile: (payload) => api.post('/problems/compile', payload).then((r) => r.data),
  run: (slug, payload) => api.post(`/problems/${slug}/run`, payload).then((r) => r.data),
  submit: (slug, payload) => api.post(`/problems/${slug}/submit`, payload).then((r) => r.data),
  submissions: (slug) => api.get(`/problems/${slug}/submissions`).then((r) => r.data),
};

export default problemService;
