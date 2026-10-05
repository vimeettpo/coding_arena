import api from './api';

const dashboardService = {
  getTrainerDashboard: () => api.get('/contests/dashboard').then((r) => r.data),
  getStudentDashboard: () => api.get('/users/student-dashboard').then((r) => r.data),
  getStudentsList: () => api.get('/users/students').then((r) => r.data),
};

export default dashboardService;
