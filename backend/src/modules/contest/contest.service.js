const Contest = require('../../models/Contest');
const ContestParticipant = require('../../models/ContestParticipant');
const Problem = require('../../models/Problem');
const { BadRequestException, ResourceNotFoundException } = require('../../common/errors');

async function create(request, creator) {
  if (!(new Date(request.endTime) > new Date(request.startTime))) {
    throw new BadRequestException('Contest end time must be after the start time.');
  }
  const problems = await Problem.find({ _id: { $in: request.problemIds } });
  if (problems.length !== request.problemIds.length) {
    throw new BadRequestException('One or more problem IDs are invalid.');
  }

  return Contest.create({
    title: request.title,
    description: request.description,
    startTime: request.startTime,
    endTime: request.endTime,
    negativeMarking: request.negativeMarking,
    createdById: creator.id,
    problemIds: problems.map((p) => p._id),
  });
}

async function list() {
  const contests = await Contest.find().sort({ startTime: -1 });
  return Promise.all(
    contests.map(async (c) => ({
      id: c.id,
      title: c.title,
      startTime: c.startTime,
      endTime: c.endTime,
      status: c.getStatus(),
      problemCount: c.problemIds.length,
      participantCount: await ContestParticipant.countDocuments({ contestId: c._id }),
    }))
  );
}

async function getDetail(contestId, currentUser) {
  const contest = await getById(contestId);
  const registered = currentUser
    ? Boolean(await ContestParticipant.exists({ contestId: contest._id, userId: currentUser.id }))
    : false;

  const problems = await Problem.find({ _id: { $in: contest.problemIds } });
  const problemSummaries = problems.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    difficulty: p.difficulty,
    tags: p.tags,
    solved: false,
    acceptanceRate: 0,
  }));

  return {
    id: contest.id,
    title: contest.title,
    description: contest.description,
    startTime: contest.startTime,
    endTime: contest.endTime,
    negativeMarking: contest.negativeMarking,
    status: contest.getStatus(),
    problems: problemSummaries,
    registered,
  };
}

async function register(contestId, user) {
  const contest = await getById(contestId);
  if (contest.getStatus() === 'ENDED') {
    throw new BadRequestException('This contest has already ended.');
  }
  const exists = await ContestParticipant.exists({ contestId: contest._id, userId: user.id });
  if (exists) return; // idempotent — already registered

  await ContestParticipant.create({ contestId: contest._id, userId: user.id });
}
async function getById(id) {
  const contest = await Contest.findById(id).catch(() => null);
  if (!contest) throw ResourceNotFoundException.of('Contest', 'id', id);
  return contest;
}

const Submission = require('../../models/Submission');
const { query } = require('../../config/postgres');

async function getContestLeaderboard(contestId) {
  const contest = await getById(contestId);
  const contestIdStr = String(contest._id);

  const accepted = await Submission.find({
    $or: [{ contestId: contestIdStr }, { contestId: String(contest.id) }],
    verdict: 'ACCEPTED',
  }).sort({ createdAt: 1 });

  const participants = await ContestParticipant.find({ contestId: contest._id }).lean();
  const registeredUserIds = new Set(participants.map((p) => String(p.userId)));

  const byUserId = new Map();

  // Initialize registered participants
  for (const uid of registeredUserIds) {
    byUserId.set(uid, { solvedProblems: new Set(), totalRuntimeMs: 0 });
  }

  // Record accepted submissions
  for (const s of accepted) {
    const uid = String(s.userId);
    if (!byUserId.has(uid)) {
      byUserId.set(uid, { solvedProblems: new Set(), totalRuntimeMs: 0 });
    }
    const entry = byUserId.get(uid);
    entry.solvedProblems.add(String(s.problemId));
    entry.totalRuntimeMs += s.runtimeMs || 0;
  }

  const userIds = [...byUserId.keys()];
  let userMap = {};
  if (userIds.length > 0) {
    try {
      const res = await query(
        `SELECT id, name, email, college_id, branch, year FROM users WHERE id::text = ANY($1)`,
        [userIds]
      );
      res.rows.forEach((r) => {
        userMap[String(r.id)] = r;
      });
    } catch (err) {
      console.error('Error fetching contest users from Postgres:', err.message);
    }
  }

  const standings = [...byUserId.entries()].map(([userId, data]) => {
    const u = userMap[userId] || {};
    const solved = data.solvedProblems.size;
    const score = solved * 100;
    return {
      userId,
      name: u.name || 'Student',
      email: u.email || 'N/A',
      collegeId: u.college_id || '—',
      branch: u.branch || '—',
      year: u.year || null,
      problemsSolved: solved,
      score,
      totalRuntimeMs: data.totalRuntimeMs,
    };
  });

  // Sort by score descending, then solved descending, then runtime ascending
  standings.sort(
    (a, b) => b.score - a.score || b.problemsSolved - a.problemsSolved || a.totalRuntimeMs - b.totalRuntimeMs
  );

  standings.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  return {
    contestId: contest.id,
    contestTitle: contest.title,
    startTime: contest.startTime,
    endTime: contest.endTime,
    status: contest.getStatus(),
    totalProblems: contest.problemIds.length,
    standings,
  };
}

module.exports = { create, list, getDetail, register, getById, getContestLeaderboard };
