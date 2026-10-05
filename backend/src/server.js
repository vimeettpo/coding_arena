const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { initPostgres } = require('./config/postgres');
const { connectDB } = require('./config/db');
const { initSocket } = require('./websocket/socket');

/**
 * Standalone entrypoint — boots PostgreSQL (Neon) and MongoDB (if configured),
 * creates HTTP server, attaches Socket.IO, and listens on env.port.
 */
async function start() {
  // 1. Initialize PostgreSQL (Users & Auth)
  await initPostgres();

  // 2. Connect to MongoDB (Problems/Quizzes/Submissions) if URI is provided
  if (env.mongodbUri) {
    try {
      await connectDB();
      console.log('Connected to MongoDB');
    } catch (err) {
      console.warn('MongoDB connection failed (non-critical if running in auth-only mode):', err.message);
    }
  } else {
    console.log('MONGODB_URI not provided; running with Neon PostgreSQL primary database.');
  }

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(env.port, () => {
    console.log(`CodeArena backend (Express) listening on port ${env.port} [${env.nodeEnv}]`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
