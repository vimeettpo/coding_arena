const ApiResponse = require('../../common/ApiResponse');
const service = require('./aptitude.service');

async function overview(req, res) {
  res.json(ApiResponse.ok(await service.getOverview(req.user)));
}

async function startTest(req, res) {
  res.json(ApiResponse.ok(await service.startTest(req.user, req.body), 'Test started.'));
}

async function getTest(req, res) {
  res.json(ApiResponse.ok(await service.getTest(req.user, req.params.id)));
}

async function submitTest(req, res) {
  res.json(ApiResponse.ok(await service.submitTest(req.user, req.params.id, req.body), 'Test submitted and graded.'));
}

async function getResult(req, res) {
  res.json(ApiResponse.ok(await service.getResult(req.user, req.params.id)));
}

async function listQuestions(req, res) {
  const { category, difficulty, search, page, limit } = req.query;
  res.json(ApiResponse.ok(await service.listQuestions(req.user, { category, difficulty, search, page, limit })));
}

async function createQuestion(req, res) {
  res.json(ApiResponse.ok(await service.createQuestion(req.user, req.body), 'Question added.'));
}

async function bulkCreate(req, res) {
  const result = await service.bulkCreate(req.user, req.body.questions);
  res.json(ApiResponse.ok(result, `${result.created} question(s) imported, ${result.skipped} duplicate(s) skipped.`));
}

async function updateQuestion(req, res) {
  res.json(ApiResponse.ok(await service.updateQuestion(req.user, req.params.id, req.body), 'Question updated.'));
}

async function removeQuestion(req, res) {
  await service.removeQuestion(req.user, req.params.id);
  res.json(ApiResponse.message('Question removed.'));
}

module.exports = {
  overview,
  startTest,
  getTest,
  submitTest,
  getResult,
  listQuestions,
  createQuestion,
  bulkCreate,
  updateQuestion,
  removeQuestion,
};
