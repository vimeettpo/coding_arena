const ApiResponse = require('../../common/ApiResponse');
const leaderboardService = require('./leaderboard.service');

async function getLeaderboard(req, res) {
  const { contestId } = req.query;
  const data = await leaderboardService.getLeaderboard(contestId || null);
  res.json(ApiResponse.ok(data));
}

module.exports = { getLeaderboard };
