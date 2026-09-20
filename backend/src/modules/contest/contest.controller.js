const ApiResponse = require('../../common/ApiResponse');
const contestService = require('./contest.service');
const trainerDashboardService = require('./trainerDashboard.service');

async function dashboard(req, res) {
  const data = await trainerDashboardService.getDashboard(req.principal.id);
  res.json(ApiResponse.ok(data));
}

async function list(_req, res) {
  const data = await contestService.list();
  res.json(ApiResponse.ok(data));
}

async function detail(req, res) {
  const data = await contestService.getDetail(req.params.id, req.user || null);
  res.json(ApiResponse.ok(data));
}

async function register(req, res) {
  await contestService.register(req.params.id, req.user);
  res.json(ApiResponse.message('Registered for the contest.'));
}

async function create(req, res) {
  await contestService.create(req.body, req.user);
  res.json(ApiResponse.message('Contest created.'));
}

async function leaderboard(req, res) {
  const data = await contestService.getContestLeaderboard(req.params.id);
  res.json(ApiResponse.ok(data));
}

module.exports = { dashboard, list, detail, register, create, leaderboard };
