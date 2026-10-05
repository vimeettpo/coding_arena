const Submission = require('../../models/Submission');
const QuizAttempt = require('../../models/QuizAttempt');
const userService = require('../user/user.service');

/**
 * Computes standings on demand from accepted submissions and quiz attempts — mirrors
 * LeaderboardService.java.
 * Only includes users who have actually attempted a quiz or solved a problem.
 * Students who secured the most marks will appear at the top (#1), and those with less at the bottom.
 */
async function getLeaderboard(contestId) {
  const filter = contestId ? { contestId, verdict: 'ACCEPTED' } : { verdict: 'ACCEPTED' };
  const accepted = await Submission.find(filter).sort({ createdAt: 1 });

  const byUserId = new Map();
  for (const s of accepted) {
    if (!byUserId.has(s.userId)) {
      byUserId.set(s.userId, { subs: [], quizScore: 0, quizCount: 0 });
    }
    byUserId.get(s.userId).subs.push(s);
  }

  // Include completed quiz scores for global leaderboard (when contestId is null)
  if (!contestId) {
    try {
      const quizAttempts = await QuizAttempt.find({ completed: true });
      for (const q of quizAttempts) {
        if (!byUserId.has(q.userId)) {
          byUserId.set(q.userId, { subs: [], quizScore: 0, quizCount: 0 });
        }
        const entry = byUserId.get(q.userId);
        entry.quizScore += q.score || 0;
        entry.quizCount += 1;
      }
    } catch (e) {
      console.warn('Could not fetch quiz attempts for leaderboard:', e.message);
    }
  }

  const standings = [...byUserId.entries()].map(([userId, data]) => {
    const { subs, quizScore, quizCount } = data;
    const solvedProblemIds = new Set(subs.map((s) => String(s.problemId)));
    const solvedCoding = solvedProblemIds.size;
    const codingScore = solvedCoding * 100;
    const totalRuntimeMs = subs.reduce((sum, s) => sum + (s.runtimeMs || 0), 0);
    const totalScore = codingScore + quizScore;
    const totalSolved = solvedCoding + quizCount;

    return {
      userId,
      solved: totalSolved,
      score: totalScore,
      totalRuntimeMs,
    };
  });

  // Sort strictly by total score/marks descending (highest marks top, lowest bottom).
  // Tie-breakers: most solved items descending, lowest runtime ascending.
  standings.sort(
    (a, b) => (b.score - a.score) || (b.solved - a.solved) || (a.totalRuntimeMs - b.totalRuntimeMs)
  );

  const entries = [];
  for (let i = 0; i < standings.length; i++) {
    const s = standings[i];
    let user;
    try {
      user = await userService.getById(s.userId);
    } catch (_e) {
      console.warn(`Could not find user ${s.userId} for leaderboard entry`);
      continue;
    }
    entries.push({
      rank: entries.length + 1,
      userId: user.id,
      name: user.name,
      college: user.college,
      solved: s.solved,
      score: s.score,
      totalRuntimeMs: s.totalRuntimeMs,
    });
  }

  return entries;
}

module.exports = { getLeaderboard };

