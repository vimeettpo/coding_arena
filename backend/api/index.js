const app = require('../src/app');
const { initPostgres } = require('../src/config/postgres');
const { connectDB } = require('../src/config/db');
const env = require('../src/config/env');

/**
 * Vercel serverless entrypoint. Ensures PostgreSQL (and MongoDB if configured)
 * is initialized before delegating to the Express app.
 */
module.exports = async (req, res) => {
  try {
    await initPostgres();
    if (env.mongodbUri) {
      await connectDB().catch((err) => {
        console.warn('MongoDB connection skipped in Vercel function:', err.message);
      });
    }
  } catch (error) {
    console.error('Database connection error in Vercel function:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection error: ' + error.message,
      error: 'DATABASE_CONNECTION_FAILED',
    });
  }
  return app(req, res);
};
