import api from './api';

// Thin wrapper around /api/aptitude/*. Every call resolves to the response
// body ({ success, data, message }), same convention as quizService.
const aptitudeService = {
  // ── Student ──
  overview: () => api.get('/aptitude/overview').then((r) => r.data),
  startTest: (payload) => api.post('/aptitude/tests', payload).then((r) => r.data),
  getTest: (id) => api.get(`/aptitude/tests/${id}`).then((r) => r.data),
  submitTest: (id, payload) => api.post(`/aptitude/tests/${id}/submit`, payload).then((r) => r.data),
  getResult: (id) => api.get(`/aptitude/tests/${id}/result`).then((r) => r.data),

  // ── Trainer / Admin: question bank ──
  listQuestions: (params) => api.get('/aptitude/questions', { params }).then((r) => r.data),
  createQuestion: (payload) => api.post('/aptitude/questions', payload).then((r) => r.data),
  bulkCreate: (questions) => api.post('/aptitude/questions/bulk', { questions }).then((r) => r.data),
  updateQuestion: (id, payload) => api.put(`/aptitude/questions/${id}`, payload).then((r) => r.data),
  deleteQuestion: (id) => api.delete(`/aptitude/questions/${id}`).then((r) => r.data),
};

export default aptitudeService;
