const ApiResponse = require('../../common/ApiResponse');
const problemService = require('./problem.service');
const submissionService = require('../submission/submission.service');

async function list(req, res) {
  const { difficulty, page = 0, size = 20 } = req.query;
  const data = await problemService.list(difficulty, parseInt(page, 10), parseInt(size, 10), req.user || null);
  res.json(ApiResponse.ok(data));
}

async function detail(req, res) {
  const data = await problemService.getDetail(req.params.slug);
  res.json(ApiResponse.ok(data));
}

async function run(req, res) {
  const { language, code, customInput } = req.body;
  const data = await submissionService.run(req.params.slug, language, code, customInput);
  res.json(ApiResponse.ok(data));
}

async function submit(req, res) {
  const { language, code } = req.body;
  const { contestId } = req.query;
  const data = await submissionService.submit(req.params.slug, language, code, req.user, contestId || null);
  res.json(ApiResponse.ok(data));
}

async function submissions(req, res) {
  const data = await submissionService.history(req.params.slug, req.user);
  res.json(ApiResponse.ok(data));
}

async function create(req, res) {
  await problemService.create(req.body, req.user);
  res.json(ApiResponse.message('Problem created. Publish it once it\'s reviewed.'));
}

async function compile(req, res) {
  const { language, code, stdin, customInput } = req.body;
  const input = stdin !== undefined ? stdin : customInput;
  const judgeService = require('../submission/judge/dockerJudgeService');
  const result = await judgeService.execute(language, code, input || '', 5000, 256);
  res.json(ApiResponse.ok({
    verdict: result.verdict === 'PENDING' ? 'ACCEPTED' : result.verdict,
    output: result.stdout || result.stderr || '',
    stderr: result.stderr || '',
    runtimeMs: result.runtimeMs || 0,
  }));
}

module.exports = { list, detail, run, submit, submissions, create, compile };
