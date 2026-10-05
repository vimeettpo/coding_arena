const Submission = require('../../models/Submission');
const Problem = require('../../models/Problem');
const Contest = require('../../models/Contest');
const Student = require('../../models/Student');
const leaderboardService = require('../leaderboard/leaderboard.service');

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

async function getDashboard(userId) {
  const [userSubmissions, recentSubmissionsList, totalProblemsCount, standings, totalStudents] = await Promise.all([
    Submission.find({ userId }).populate('problemId').lean(),
    Submission.find({ userId }).sort({ createdAt: -1 }).limit(10).populate('problemId').lean(),
    Problem.countDocuments(),
    leaderboardService.getLeaderboard(null),
    Student.countDocuments(),
  ]);

  // 2. Solved problems
  const solvedProblemIds = new Set(
    userSubmissions
      .filter((s) => s.verdict === 'ACCEPTED' && s.problemId)
      .map((s) => String(s.problemId._id || s.problemId))
  );
  const solvedCount = solvedProblemIds.size;

  // 3. Rank & percentile
  let rankLabel = 'Unranked';
  let rankPercentile = 'Solve problems to rank';
  const idx = standings.findIndex((e) => e.userId === userId);
  if (idx !== -1) {
    const rank = idx + 1;
    rankLabel = `#${rank}`;
    const pct = Math.max(1, Math.round((rank / Math.max(1, totalStudents)) * 100));
    rankPercentile = `Top ${pct}% overall`;
  }

  // 4. Streak calculation
  const activeDates = [...new Set(
    userSubmissions
      .filter((s) => s.createdAt)
      .map((s) => new Date(s.createdAt).toISOString().slice(0, 10))
  )].sort();

  let streakDays = 0;
  let personalBestStreak = 0;
  if (activeDates.length > 0) {
    const dateSet = new Set(activeDates);
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    let checkDate = dateSet.has(today) ? today : dateSet.has(yesterday) ? yesterday : null;
    while (checkDate && dateSet.has(checkDate)) {
      streakDays++;
      checkDate = new Date(new Date(checkDate).getTime() - 86400000).toISOString().slice(0, 10);
    }

    let tempStreak = 1;
    personalBestStreak = 1;
    for (let i = 1; i < activeDates.length; i++) {
      const prev = new Date(activeDates[i - 1]);
      const cur = new Date(activeDates[i]);
      if ((cur - prev) / 86400000 === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
      personalBestStreak = Math.max(personalBestStreak, tempStreak);
    }
    personalBestStreak = Math.max(personalBestStreak, streakDays);
  }

  // 5. Weekly activity (Mon-Sun of current week)
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Sun
  const diffToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday));
  const nextMonday = new Date(monday.getTime() + 7 * 86400000);

  const dailyCount = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  for (const s of userSubmissions) {
    if (!s.createdAt) continue;
    const dt = new Date(s.createdAt);
    if (dt >= monday && dt < nextMonday) {
      dailyCount[DAY_LABELS[dt.getUTCDay()]]++;
    }
  }
  const weeklyActivity = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
    day,
    count: dailyCount[day],
  }));

  // 6. Upcoming events (live/upcoming contests)
  const nowTs = Date.now();
  const upcomingContests = (await Contest.find({ endTime: { $gt: new Date() } }).sort({ startTime: 1 }).limit(4))
    .sort((a, b) => a.startTime - b.startTime);

  const upcomingEvents = upcomingContests.map((c) => {
    let when;
    if (c.startTime.getTime() < nowTs) {
      when = 'Live now';
    } else {
      const hours = Math.floor((c.startTime.getTime() - nowTs) / 3600000);
      if (hours < 24) {
        when = hours <= 1 ? 'In less than an hour' : `In ${hours} hours`;
      } else {
        const days = Math.floor(hours / 24);
        when = `In ${days} day${days > 1 ? 's' : ''}`;
      }
    }
    return { id: c.id, title: c.title, when, type: 'Contest' };
  });

  // 7. Recent submissions
  const recentItems = recentSubmissionsList.map((s) => ({
    id: String(s._id),
    problemTitle: s.problemId && s.problemId.title ? s.problemId.title : 'Problem',
    verdict: s.verdict || 'PENDING',
    language: s.language || 'Code',
    createdAt: s.createdAt,
  }));

  // 8. Skill progress by tags
  const allProblems = await Problem.find().lean();
  const tagToProblems = {};
  for (const p of allProblems) {
    for (const tag of p.tags || []) {
      const key = tag.trim();
      if (!tagToProblems[key]) tagToProblems[key] = [];
      tagToProblems[key].push(p);
    }
  }
  if (Object.keys(tagToProblems).length === 0) {
    tagToProblems['Arrays & Strings'] = allProblems;
    tagToProblems['Dynamic Programming'] = allProblems;
    tagToProblems['Graphs'] = allProblems;
    tagToProblems['Algorithms'] = allProblems;
  }
  const skillProgress = Object.entries(tagToProblems)
    .slice(0, 4)
    .map(([tag, problems]) => {
      const solvedWithTag = problems.filter((p) => solvedProblemIds.has(String(p._id))).length;
      const pct = problems.length === 0 ? 0 : Math.round((solvedWithTag / problems.length) * 1000) / 10;
      return { tag, percent: pct };
    });

  return {
    rankLabel,
    rankPercentile,
    solvedCount,
    totalProblemsCount,
    streakDays,
    personalBestStreak,
    pendingCount: upcomingEvents.length,
    weeklyActivity,
    upcomingEvents,
    recentSubmissions: recentItems,
    skillProgress,
  };
}

async function getAllStudents() {
  const students = await Student.find().lean();
  const results = await Promise.all(
    students.map(async (student) => {
      let solvedCount = 0;
      let totalSubmissions = 0;
      try {
        const submissions = await Submission.find({ userId: String(student._id) }).lean();
        totalSubmissions = submissions.length;
        solvedCount = new Set(
          submissions.filter((s) => s.verdict === 'ACCEPTED' && s.problemId).map((s) => String(s.problemId))
        ).size;
      } catch (_e) {
        // swallow, same as the Java try/catch guard
      }
      return {
        id: String(student._id),
        name: student.name || 'Student',
        email: student.email,
        college: student.college,
        year: student.year,
        branch: student.branch,
        emailVerified: student.emailVerified,
        solvedCount,
        totalSubmissions,
        createdAt: student.createdAt,
      };
    })
  );
  return results.sort((a, b) => b.solvedCount - a.solvedCount);
}

module.exports = { getDashboard, getAllStudents };
