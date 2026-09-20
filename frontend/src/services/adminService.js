import api from './api';

const adminService = {
  getDomains: () => api.get('/admin/domains').then((r) => r.data),
  addDomain: (domain) => api.post('/admin/domains', { domain }).then((r) => r.data),
  removeDomain: (id) => api.delete(`/admin/domains/${id}`).then((r) => r.data),
};

export default adminService;
