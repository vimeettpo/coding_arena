const ApiResponse = require('../../common/ApiResponse');
const quizService = require('./quiz.service');

async function list(req, res) {
  const data = await quizService.list(req.user || null);
  res.json(ApiResponse.ok(data));
}

async function getDetail(req, res) {
  const data = await quizService.getDetail(req.params.id, req.user || null);
  res.json(ApiResponse.ok(data));
}

async function create(req, res) {
  await quizService.create(req.body, req.user);
  res.json(ApiResponse.message('Test created successfully.'));
}

async function submit(req, res) {
  const data = await quizService.submit(req.params.id, req.body, req.user);
  res.json(ApiResponse.ok(data, 'Test submitted and graded.'));
}

async function getResult(req, res) {
  const data = await quizService.getResult(req.params.id, req.user);
  res.json(ApiResponse.ok(data));
}

async function remove(req, res) {
  await quizService.remove(req.params.id, req.user);
  res.json(ApiResponse.message('Test deleted successfully.'));
}

async function leaderboard(req, res) {
  const data = await quizService.getQuizLeaderboard(req.params.id);
  res.json(ApiResponse.ok(data));
}

module.exports = { list, getDetail, create, submit, getResult, remove, leaderboard };
