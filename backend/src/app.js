require('express-async-errors'); // lets async route handlers throw and land in errorHandler
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const { populateUser } = require('./middleware/auth');
const { errorHandler, notFoundHandler } = require('./common/errorHandler');

const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/user/user.routes');
const problemRoutes = require('./modules/problem/problem.routes');
const contestRoutes = require('./modules/contest/contest.routes');
const quizRoutes = require('./modules/quiz/quiz.routes');
const leaderboardRoutes = require('./modules/leaderboard/leaderboard.routes');
const adminRoutes = require('./modules/admin/admin.routes');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      return callback(null, origin);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (env.nodeEnv !== 'test') {
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
}

// Populate req.user/req.principal from the Authorization header on every
// request (mirrors JwtAuthenticationFilter running before the security
// chain); individual routes then apply requireAuth/requireRole as needed.
app.use(populateUser);

app.get('/', (_req, res) => {
  res.json({ service: 'codearena-backend-express', status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// PUBLIC_ENDPOINTS in SecurityConfig.java: /api/auth/** is public — enforced
// per-route inside auth.routes.js (register/login/etc. are open; /me and
// /logout require auth).
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/problems', problemRoutes); // SecurityConfig requires auth on all of /api/problems/**
app.use('/api/contests', contestRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
