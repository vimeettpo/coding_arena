const ApiResponse = require('../../common/ApiResponse');
const studentDashboardService = require('./studentDashboard.service');

async function studentDashboard(req, res) {
  const data = await studentDashboardService.getDashboard(req.principal.id);
  res.json(ApiResponse.ok(data));
}

async function getStudents(_req, res) {
  const data = await studentDashboardService.getAllStudents();
  res.json(ApiResponse.ok(data));
}

module.exports = { studentDashboard, getStudents };
