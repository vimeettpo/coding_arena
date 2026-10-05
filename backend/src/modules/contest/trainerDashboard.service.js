const Contest = require('../../models/Contest');
const ContestParticipant = require('../../models/ContestParticipant');
const Submission = require('../../models/Submission');
const Student = require('../../models/Student');
const userService = require('../user/user.service');

async function getDashboard(trainerId) {
  // 1. Student count (global)
  const studentCount = await Student.countDocuments();

  // 2. Trainer's contests
  const myContests = await Contest.find({ createdById: trainerId }).sort({ startTime: -1 });
  const myContestCount = myContests.length;

  const activeContests = myContests.filter((c) => ['LIVE', 'UPCOMING'].includes(c.getStatus()));
  const activeContestCount = activeContests.length;

  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const startingToday = myContests.filter((c) => c.startTime >= todayStart && c.startTime < todayEnd).length;
  const liveNow = myContests.filter((c) => c.getStatus() === 'LIVE').length;

  let activeContestSublabel;
  if (liveNow > 0) {
    activeContestSublabel = `${liveNow} live now`;
  } else if (startingToday > 0) {
    activeContestSublabel = `${startingToday} starting today`;
  } else {
    activeContestSublabel = activeContestCount > 0 ? `${activeContestCount} upcoming` : 'None scheduled';
  }

  // 3. Submissions for this trainer's contests
  const contestIds = myContests.map((c) => String(c._id));
  const allSubmissions = contestIds.length ? await Submission.find({ contestId: { $in: contestIds } }) : [];

  const pendingSubmissions = allSubmissions.filter((s) => s.verdict === 'PENDING').length;

  // 4. Average score across all trainer's contests
  const gradedSubmissions = allSubmissions.filter((s) => s.verdict !== 'PENDING' && s.testCasesTotal > 0);
  let avgScorePercent = 0;
  if (gradedSubmissions.length) {
    const totalPercent = gradedSubmissions.reduce((sum, s) => sum + (s.testCasesPassed / s.testCasesTotal) * 100, 0);
    avgScorePercent = Math.round((totalPercent / gradedSubmissions.length) * 10) / 10;
  }

  // 5. Average score by event (bar chart) — last 6 contests
  const recentContests = myContests.slice(0, 6);
  const submissionsByContest = new Map();
  for (const s of allSubmissions) {
    if (!s.contestId) continue;
    if (!submissionsByContest.has(s.contestId)) submissionsByContest.set(s.contestId, []);
    submissionsByContest.get(s.contestId).push(s);
  }

  const eventScores = recentContests.map((contest) => {
    const contestSubs = (submissionsByContest.get(String(contest._id)) || [])
      .filter((s) => s.verdict !== 'PENDING' && s.testCasesTotal > 0);
    const avg = contestSubs.length
      ? contestSubs.reduce((sum, s) => sum + (s.testCasesPassed / s.testCasesTotal) * 100, 0) / contestSubs.length
      : 0;
    return { eventTitle: contest.title, avgScore: Math.round(avg * 10) / 10 };
  }).reverse(); // oldest first (chronological left-to-right on chart)

  // 6. Top performers (across this trainer's contests)
  const accepted = allSubmissions.filter((s) => s.verdict === 'ACCEPTED');
  const byUserId = new Map();
  for (const s of accepted) {
    if (!byUserId.has(s.userId)) byUserId.set(s.userId, []);
    byUserId.get(s.userId).push(s);
  }

  const topPerformersRaw = await Promise.all(
    [...byUserId.entries()].map(async ([userId, subs]) => {
      const solved = new Set(subs.map((s) => String(s.problemId))).size;
      const score = solved * 100;
      let name = 'Unknown';
      try {
        const user = await userService.getById(userId);
        name = user.name;
      } catch (_e) {
        // keep 'Unknown'
      }
      return { name, score, solved };
    })
  );
  const topPerformers = topPerformersRaw
    .sort((a, b) => (b.score - a.score) || (b.solved - a.solved))
    .slice(0, 5);

  // 7. Contest participation rates
  const contestParticipation = await Promise.all(
    recentContests.slice(0, 5).map(async (contest) => {
      const participants = await ContestParticipant.countDocuments({ contestId: contest._id });
      const rate = studentCount > 0 ? Math.round((participants / studentCount) * 1000) / 10 : 0;
      return { eventTitle: contest.title, participationRate: rate };
    })
  );

  return {
    studentCount,
    activeContestCount,
    activeContestSublabel,
    myContestCount,
    pendingSubmissions,
    avgScorePercent,
    eventScores,
    topPerformers,
    contestParticipation,
  };
}

module.exports = { getDashboard };
