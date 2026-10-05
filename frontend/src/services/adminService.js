import api from './api';

const adminService = {
  // Analytics
  getOverview: () => api.get('/admin/analytics/overview').then((r) => r.data),
  getChartsData: () => api.get('/admin/analytics/charts').then((r) => r.data),

  // Users (Students & Faculty)
  getUsers: (params = {}) => api.get('/admin/users', { params }).then((r) => r.data),
  createUser: (data) => api.post('/admin/users', data).then((r) => r.data),
  bulkImportUsers: (data) => api.post('/admin/users/bulk-import', data).then((r) => r.data),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data),
  updateUserStatus: (id, enabled) => api.patch(`/admin/users/${id}/status`, { enabled }).then((r) => r.data),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data).then((r) => r.data),
  resetUserPassword: (id, newPassword) => api.post(`/admin/users/${id}/reset-password`, { newPassword }).then((r) => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data),
  exportUsersCSV: (role = '', branch = '') =>
    api.get('/admin/users/export', { params: { role, branch }, responseType: 'blob' }).then((r) => r.data),

  // Code Bank / Problems
  getProblems: (params = {}) => api.get('/admin/problems', { params }).then((r) => r.data),
  createProblem: (data) => api.post('/admin/problems', data).then((r) => r.data),
  updateProblem: (id, data) => api.put(`/admin/problems/${id}`, data).then((r) => r.data),
  togglePublishProblem: (id) => api.patch(`/admin/problems/${id}/toggle-publish`).then((r) => r.data),
  deleteProblem: (id) => api.delete(`/admin/problems/${id}`).then((r) => r.data),

  // Test Cases
  getTestCases: (problemId) => api.get(`/admin/problems/${problemId}/testcases`).then((r) => r.data),
  addTestCase: (problemId, data) => api.post(`/admin/problems/${problemId}/testcases`, data).then((r) => r.data),
  deleteTestCase: (tcId) => api.delete(`/admin/problems/testcases/${tcId}`).then((r) => r.data),

  // Contests & Assessments
  getContests: (params = {}) => api.get('/admin/contests', { params }).then((r) => r.data),
  createContest: (data) => api.post('/admin/contests', data).then((r) => r.data),
  updateContest: (id, data) => api.put(`/admin/contests/${id}`, data).then((r) => r.data),
  deleteContest: (id) => api.delete(`/admin/contests/${id}`).then((r) => r.data),
  getContestParticipants: (id) => api.get(`/admin/contests/${id}/participants`).then((r) => r.data),

  // Domains Whitelist
  getDomains: () => api.get('/admin/domains').then((r) => r.data),
  addDomain: (domain) => api.post('/admin/domains', { domain }).then((r) => r.data),
  removeDomain: (id) => api.delete(`/admin/domains/${id}`).then((r) => r.data),
};

export default adminService;
