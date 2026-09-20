const mongoose = require('mongoose');
const { query } = require('../../config/postgres');
const Problem = require('../../models/Problem');
const Contest = require('../../models/Contest');
const Submission = require('../../models/Submission');
const { COLLEGE_BRANCHES } = require('./admin.constants');

/**
 * Platform & Department Analytics Service
 */
async function getOverview() {
  // 1. Fetch User Metrics from PostgreSQL
  let totalUsers = 0;
  let totalStudents = 0;
  let totalFaculty = 0;
  let totalAdmins = 0;
  let activeUsers = 0;
  let branchCounts = {};

  COLLEGE_BRANCHES.forEach((b) => {
    branchCounts[b] = 0;
  });

  try {
    const userStats = await query(`
      SELECT 
        COUNT(*) AS total_users,
        COUNT(*) FILTER (WHERE role = 'STUDENT') AS total_students,
        COUNT(*) FILTER (WHERE role = 'TRAINER') AS total_faculty,
        COUNT(*) FILTER (WHERE role = 'ADMIN') AS total_admins,
        COUNT(*) FILTER (WHERE enabled = TRUE) AS active_users
      FROM users
    `);

    if (userStats.rows.length > 0) {
      const row = userStats.rows[0];
      totalUsers = parseInt(row.total_users || 0, 10);
      totalStudents = parseInt(row.total_students || 0, 10);
      totalFaculty = parseInt(row.total_faculty || 0, 10);
      totalAdmins = parseInt(row.total_admins || 0, 10);
      activeUsers = parseInt(row.active_users || 0, 10);
    }

    const branchStats = await query(`
      SELECT branch, COUNT(*) AS count 
      FROM users 
      WHERE branch IS NOT NULL AND role = 'STUDENT'
      GROUP BY branch
    `);

    branchStats.rows.forEach((r) => {
      if (r.branch) {
        branchCounts[r.branch] = parseInt(r.count, 10);
      }
    });
  } catch (err) {
    console.error('Error fetching user stats in getOverview:', err.message);
  }

  // 2. Fetch CodeArena Content & Activity from MongoDB
  let totalProblems = 0;
  let publishedProblems = 0;
  let draftProblems = 0;
  let totalContests = 0;
  let activeContests = 0;
  let totalSubmissions = 0;
  let acceptedSubmissions = 0;

  const mongoConnected = mongoose.connection && mongoose.connection.readyState === 1;

  if (mongoConnected) {
    try {
      const [problemsCount, publishedCount, contestsCount, nowContests, subsTotal, subsAccepted] =
        await Promise.all([
          Problem.countDocuments(),
          Problem.countDocuments({ published: true }),
          Contest.countDocuments(),
          Contest.countDocuments({ startTime: { $lte: new Date() }, endTime: { $gte: new Date() } }),
          Submission.countDocuments(),
          Submission.countDocuments({ verdict: 'ACCEPTED' }),
        ]);

      totalProblems = problemsCount;
      publishedProblems = publishedCount;
      draftProblems = Math.max(0, problemsCount - publishedCount);
      totalContests = contestsCount;
      activeContests = nowContests;
      totalSubmissions = subsTotal;
      acceptedSubmissions = subsAccepted;
    } catch (err) {
      console.error('Error fetching mongo stats in getOverview:', err.message);
    }
  }

  const passRate = totalSubmissions > 0 ? ((acceptedSubmissions / totalSubmissions) * 100).toFixed(1) : '0.0';

  // Placement readiness metric: students who have submitted code
  const placementReadiness = totalStudents > 0 ? Math.min(100, Math.round((acceptedSubmissions / Math.max(1, totalStudents * 5)) * 100)) : 0;

  return {
    users: {
      total: totalUsers,
      students: totalStudents,
      faculty: totalFaculty,
      admins: totalAdmins,
      active: activeUsers,
    },
    branchDistribution: branchCounts,
    content: {
      totalProblems,
      publishedProblems,
      draftProblems,
      totalContests,
      activeContests,
    },
    activity: {
      totalSubmissions,
      acceptedSubmissions,
      passRate: parseFloat(passRate),
      placementReadinessScore: placementReadiness,
    },
    system: {
      postgres: 'connected',
      mongo: mongoConnected ? 'connected' : 'disconnected',
      judgeSandbox: process.env.JUDGE_DISABLED === 'true' ? 'mock_ready' : 'docker_active',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Deep Dive Charts & Academic Aggregations
 */
async function getChartsData() {
  const mongoConnected = mongoose.connection && mongoose.connection.readyState === 1;

  let languageUsage = {
    JAVA: 0,
    PYTHON: 0,
    CPP: 0,
    C: 0,
    JAVASCRIPT: 0,
  };

  let verdictsBreakdown = {
    ACCEPTED: 0,
    WRONG_ANSWER: 0,
    TIME_LIMIT_EXCEEDED: 0,
    COMPILATION_ERROR: 0,
    RUNTIME_ERROR: 0,
  };

  let recentSubmissions = [];

  if (mongoConnected) {
    try {
      // Language Aggregation
      const langAgg = await Submission.aggregate([
        { $group: { _id: '$language', count: { $sum: 1 } } },
      ]);
      langAgg.forEach((item) => {
        if (item._id && languageUsage[item._id] !== undefined) {
          languageUsage[item._id] = item.count;
        }
      });

      // Verdicts Aggregation
      const verdictAgg = await Submission.aggregate([
        { $group: { _id: '$verdict', count: { $sum: 1 } } },
      ]);
      verdictAgg.forEach((item) => {
        if (item._id && verdictsBreakdown[item._id] !== undefined) {
          verdictsBreakdown[item._id] = item.count;
        }
      });

      // Recent 10 Submissions for live feed
      const rawRecent = await Submission.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('problemId', 'title difficulty')
        .lean();

      recentSubmissions = rawRecent.map((sub) => ({
        id: String(sub._id),
        problemTitle: sub.problemId?.title || 'Coding Problem',
        difficulty: sub.problemId?.difficulty || 'MEDIUM',
        language: sub.language,
        verdict: sub.verdict,
        runtimeMs: sub.runtimeMs || 0,
        createdAt: sub.createdAt,
      }));
    } catch (err) {
      console.error('Error computing mongo chart data:', err.message);
    }
  }

  // Branch statistics from PostgreSQL
  const branchData = {};
  COLLEGE_BRANCHES.forEach((b) => {
    branchData[b] = 0;
  });

  try {
    const branchRes = await query(`
      SELECT branch, COUNT(*) AS count
      FROM users
      WHERE branch IS NOT NULL AND role = 'STUDENT'
      GROUP BY branch
    `);
    branchRes.rows.forEach((r) => {
      if (r.branch) branchData[r.branch] = parseInt(r.count, 10);
    });
  } catch (err) {
    console.error('Error querying branch data for charts:', err.message);
  }

  // User growth by month/week from PostgreSQL
  let userGrowth = [];
  try {
    const growthRes = await query(`
      SELECT TO_CHAR(created_at, 'Mon DD') AS date_label, COUNT(*) AS new_users
      FROM users
      WHERE created_at >= NOW() - INTERVAL '14 days'
      GROUP BY TO_CHAR(created_at, 'Mon DD'), DATE_TRUNC('day', created_at)
      ORDER BY DATE_TRUNC('day', created_at) ASC
    `);
    userGrowth = growthRes.rows.map((r) => ({
      date: r.date_label,
      count: parseInt(r.new_users, 10),
    }));
  } catch (err) {
    console.error('Error querying user growth:', err.message);
  }

  return {
    languageUsage,
    verdictsBreakdown,
    branchDistribution: branchData,
    userGrowth,
    recentSubmissions,
  };
}

module.exports = {
  getOverview,
  getChartsData,
};
