const Contest = require('../../models/Contest');
const ContestParticipant = require('../../models/ContestParticipant');
const Problem = require('../../models/Problem');
const { query } = require('../../config/postgres');
const { ResourceNotFoundException, BadRequestException } = require('../../common/errors');

/**
 * List all contests with live status and counts
 */
async function listAllContests({ status = '', search = '' }) {
  const filter = {};
  if (search && search.trim()) {
    filter.title = new RegExp(search.trim(), 'i');
  }

  const now = new Date();
  if (status === 'RUNNING') {
    filter.startTime = { $lte: now };
    filter.endTime = { $gte: now };
  } else if (status === 'UPCOMING') {
    filter.startTime = { $gt: now };
  } else if (status === 'ENDED') {
    filter.endTime = { $lt: now };
  }

  const contests = await Contest.find(filter).sort({ startTime: -1 }).lean();

  return Promise.all(
    contests.map(async (c) => {
      const participantCount = await ContestParticipant.countDocuments({ contestId: c._id });
      const cStartTime = new Date(c.startTime);
      const cEndTime = new Date(c.endTime);

      let currentStatus = 'UPCOMING';
      if (now >= cStartTime && now <= cEndTime) {
        currentStatus = 'RUNNING';
      } else if (now > cEndTime) {
        currentStatus = 'ENDED';
      }

      return {
        id: String(c._id),
        title: c.title,
        description: c.description,
        startTime: c.startTime,
        endTime: c.endTime,
        negativeMarking: Boolean(c.negativeMarking),
        targetBranch: c.targetBranch || 'ALL',
        targetYear: c.targetYear || null,
        allowedLanguages: Array.isArray(c.allowedLanguages) ? c.allowedLanguages : [],
        passingPercentage: c.passingPercentage || 50,
        status: currentStatus,
        problemCount: Array.isArray(c.problemIds) ? c.problemIds.length : 0,
        problemIds: Array.isArray(c.problemIds) ? c.problemIds.map(String) : [],
        participantCount,
        createdAt: c.createdAt,
      };
    })
  );
}

/**
 * Create a new contest
 */
async function createContest(data, adminUser) {
  if (new Date(data.endTime) <= new Date(data.startTime)) {
    throw new BadRequestException('End time must be after the start time.');
  }

  const problems = await Problem.find({ _id: { $in: data.problemIds } });
  if (problems.length !== data.problemIds.length) {
    throw new BadRequestException('One or more selected problem IDs are invalid.');
  }

  const contest = await Contest.create({
    title: data.title.trim(),
    description: data.description || '',
    startTime: data.startTime,
    endTime: data.endTime,
    negativeMarking: Boolean(data.negativeMarking),
    targetBranch: data.targetBranch || 'ALL',
    targetYear: data.targetYear || null,
    allowedLanguages: Array.isArray(data.allowedLanguages) ? data.allowedLanguages : [],
    passingPercentage: data.passingPercentage || 50,
    createdById: String(adminUser.id),
    problemIds: problems.map((p) => p._id),
  });

  return {
    id: String(contest._id),
    title: contest.title,
    startTime: contest.startTime,
    endTime: contest.endTime,
    targetBranch: contest.targetBranch,
    targetYear: contest.targetYear,
    allowedLanguages: contest.allowedLanguages,
    problemCount: contest.problemIds.length,
  };
}

/**
 * Update contest
 */
async function updateContest(id, data) {
  const contest = await Contest.findById(id);
  if (!contest) {
    throw ResourceNotFoundException.of('Contest', 'id', id);
  }

  if (data.title) contest.title = data.title.trim();
  if (data.description !== undefined) contest.description = data.description;
  if (data.startTime) contest.startTime = data.startTime;
  if (data.endTime) contest.endTime = data.endTime;
  if (data.negativeMarking !== undefined) contest.negativeMarking = Boolean(data.negativeMarking);
  if (data.targetBranch !== undefined) contest.targetBranch = data.targetBranch;
  if (data.targetYear !== undefined) contest.targetYear = data.targetYear;
  if (data.allowedLanguages !== undefined) contest.allowedLanguages = data.allowedLanguages;
  if (data.passingPercentage !== undefined) contest.passingPercentage = data.passingPercentage;

  if (data.problemIds) {
    const problems = await Problem.find({ _id: { $in: data.problemIds } });
    if (problems.length !== data.problemIds.length) {
      throw new BadRequestException('One or more problem IDs are invalid.');
    }
    contest.problemIds = problems.map((p) => p._id);
  }

  await contest.save();
  return contest;
}

/**
 * Delete contest
 */
async function deleteContest(id) {
  const contest = await Contest.findById(id);
  if (!contest) {
    throw ResourceNotFoundException.of('Contest', 'id', id);
  }

  await ContestParticipant.deleteMany({ contestId: contest._id });
  await Contest.findByIdAndDelete(id);

  return { message: `Contest "${contest.title}" deleted successfully.` };
}

/**
 * Get contest participants and their details
 */
async function getContestParticipants(contestId) {
  const contest = await Contest.findById(contestId);
  if (!contest) {
    throw ResourceNotFoundException.of('Contest', 'id', contestId);
  }

  const participants = await ContestParticipant.find({ contestId: contest._id }).lean();
  if (participants.length === 0) {
    return [];
  }

  const userIds = participants.map((p) => p.userId);

  // Fetch names and branches from PostgreSQL
  let userMap = {};
  try {
    const res = await query(
      `SELECT id, name, email, college_id, branch, year FROM users WHERE id::text = ANY($1)`,
      [userIds]
    );
    res.rows.forEach((r) => {
      userMap[String(r.id)] = r;
    });
  } catch (err) {
    console.error('Error fetching participant users from Postgres:', err.message);
  }

  return participants.map((p) => {
    const u = userMap[String(p.userId)] || {};
    return {
      id: String(p._id),
      userId: p.userId,
      name: u.name || 'Student',
      email: u.email || 'N/A',
      collegeId: u.college_id || 'N/A',
      branch: u.branch || 'N/A',
      year: u.year || null,
      registeredAt: p.registeredAt,
      score: p.score || 0,
      problemsSolved: p.problemsSolved || 0,
    };
  });
}

module.exports = {
  listAllContests,
  createContest,
  updateContest,
  deleteContest,
  getContestParticipants,
};
