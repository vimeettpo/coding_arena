const { Server } = require('socket.io');
const env = require('../config/env');

let io = null;

/**
 * Replaces WebSocketConfig.java's STOMP broker. Spring clients subscribed
 * to /topic/leaderboard/global or /topic/leaderboard/{contestId}; Socket.IO
 * clients instead do:
 *
 *   const socket = io(API_URL);
 *   socket.emit('leaderboard:subscribe', { contestId: null }); // or a contest id
 *   socket.on('leaderboard:update', (entries) => { ... });
 *
 * NOTE: like the Docker judge, this requires a long-lived process and will
 * NOT work on Vercel serverless functions (no persistent connections
 * between invocations). Host this alongside the judge on a VM/Render/
 * Railway/Fly.io, and point the frontend's socket client at that host
 * instead of the Vercel deployment. See README.md.
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.cors.allowedOrigins, credentials: true },
  });

  io.on('connection', (socket) => {
    socket.on('leaderboard:subscribe', ({ contestId } = {}) => {
      const room = contestId ? `leaderboard:${contestId}` : 'leaderboard:global';
      socket.join(room);
    });

    socket.on('leaderboard:unsubscribe', ({ contestId } = {}) => {
      const room = contestId ? `leaderboard:${contestId}` : 'leaderboard:global';
      socket.leave(room);
    });
  });

  return io;
}

/** Mirrors SubmissionService#broadcastLeaderboardUpdate. */
function broadcastLeaderboard(contestId, entries) {
  if (!io) return; // socket layer not initialized (e.g. serverless deployment) — skip silently
  const room = contestId ? `leaderboard:${contestId}` : 'leaderboard:global';
  io.to(room).emit('leaderboard:update', entries);
}

module.exports = { initSocket, broadcastLeaderboard };
