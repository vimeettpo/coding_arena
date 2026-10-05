const TestCase = require('../../models/TestCase');
const Submission = require('../../models/Submission');
const problemService = require('../problem/problem.service');
const judgeService = require('./judge/dockerJudgeService');
const outputComparator = require('./judge/outputComparator');
const leaderboardService = require('../leaderboard/leaderboard.service');
const { broadcastLeaderboard } = require('../../websocket/socket');

/**
 * "Run" — executes against either the student's custom input or the
 * problem's first visible example. Nothing is persisted; this is a
 * scratchpad action, not a graded attempt. Mirrors SubmissionService#run.
 */
async function run(slug, language, code, customInput) {
  const problem = await problemService.getPublishedBySlug(slug);

  let stdin = customInput;
  if (!stdin || !stdin.trim()) {
    const visible = await TestCase.find({ problemId: problem._id, hidden: false });
    stdin = visible.length ? visible[0].input : '';
  }

  const result = await judgeService.execute(language, code, stdin, problem.timeLimitMs, problem.memoryLimitMb);
  const verdict = result.verdict === 'PENDING' ? 'ACCEPTED' : result.verdict;
  const output = result.verdict === 'PENDING' ? result.stdout : result.stderr;

  return { verdict, output, stderr: result.stderr, runtimeMs: result.runtimeMs };
}

/**
 * "Submit" — runs every hidden + visible test case, persists the result,
 * and broadcasts the updated leaderboard so every connected client sees
 * the new standing without polling. Mirrors SubmissionService#submit.
 */
async function submit(slug, language, code, user, contestId) {
  const problem = await problemService.getPublishedBySlug(slug);
  const testCases = await TestCase.find({ problemId: problem._id });

  let finalVerdict = 'ACCEPTED';
  let passed = 0;
  let maxRuntimeMs = 0;
  let failingOutput = null;

  for (const testCase of testCases) {
    const result = await judgeService.execute(language, code, testCase.input, problem.timeLimitMs, problem.memoryLimitMb);
    maxRuntimeMs = Math.max(maxRuntimeMs, result.runtimeMs);

    const caseVerdict = result.verdict === 'PENDING'
      ? outputComparator.compare(result.stdout, testCase.expectedOutput)
      : result.verdict;

    if (caseVerdict === 'ACCEPTED') {
      passed++;
    } else if (finalVerdict === 'ACCEPTED') {
      // Keep the first failure encountered as the submission's verdict.
      finalVerdict = caseVerdict;
      failingOutput = result.verdict === 'PENDING' ? result.stdout : result.stderr;
    }
  }

  const submission = await Submission.create({
    userId: user.id,
    problemId: problem._id,
    contestId: contestId || null,
    language,
    code,
    verdict: finalVerdict,
    runtimeMs: maxRuntimeMs,
    testCasesPassed: passed,
    testCasesTotal: testCases.length,
    judgeOutput: failingOutput,
  });

  await broadcastLeaderboardUpdate(contestId);

  return {
    submissionId: submission.id,
    verdict: finalVerdict,
    testCasesPassed: passed,
    testCasesTotal: testCases.length,
    runtimeMs: maxRuntimeMs,
    judgeOutput: failingOutput,
  };
}

async function history(slug, user) {
  const problem = await problemService.getPublishedBySlug(slug);
  const submissions = await Submission.find({ userId: user.id, problemId: problem._id })
    .sort({ createdAt: -1 })
    .limit(20);

  return submissions.map((s) => ({
    id: s.id,
    language: s.language,
    verdict: s.verdict,
    runtimeMs: s.runtimeMs,
    createdAt: s.createdAt,
  }));
}

async function broadcastLeaderboardUpdate(contestId) {
  try {
    const entries = await leaderboardService.getLeaderboard(contestId || null);
    broadcastLeaderboard(contestId || null, entries);
  } catch (err) {
    console.warn(`Failed to broadcast leaderboard update for contest ${contestId}:`, err.message);
  }
}

module.exports = { run, submit, history };
