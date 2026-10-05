import api from './api';

const leaderboardService = {
  getLeaderboard: (contestId) => api.get('/leaderboard', { params: contestId ? { contestId } : {} }).then((r) => r.data),
};

export default leaderboardService;
