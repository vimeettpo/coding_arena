require('dotenv').config();

function bool(value, fallback) {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8080', 10),

  databaseUrl: process.env.DATABASE_URL,
  mongodbUri: process.env.MONGODB_URI,

  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-dev-secret-change-this-dev-secret-please',
    accessTokenExpiryMs: parseInt(process.env.JWT_ACCESS_EXPIRY_MS || '3600000', 10),
    refreshTokenExpiryMs: parseInt(process.env.JWT_REFRESH_EXPIRY_MS || '604800000', 10),
  },

  cors: {
    allowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  },


  judge: {
    disabled: bool(process.env.JUDGE_DISABLED, false),
    workdir: process.env.JUDGE_WORKDIR || '/tmp/codearena-submissions',
    executionTimeoutSeconds: parseInt(process.env.JUDGE_TIMEOUT_SECONDS || '10', 10),
    memoryLimitMb: parseInt(process.env.JUDGE_MEMORY_MB || '256', 10),
    cpuLimit: parseFloat(process.env.JUDGE_CPU_LIMIT || '1'),
    pidsLimit: parseInt(process.env.JUDGE_PIDS_LIMIT || '64', 10),
  },

  adminSecretCode: process.env.ADMIN_SECRET_CODE || 'codearena-admin-2026',
};

if (env.nodeEnv === 'production') {
  if (!process.env.ADMIN_SECRET_CODE || env.adminSecretCode === 'codearena-admin-2026') {
    console.warn('[SECURITY WARNING] ADMIN_SECRET_CODE is using default dev secret! Please set a strong private ADMIN_SECRET_CODE in .env.');
  }
  if (!process.env.JWT_SECRET || env.jwt.secret.includes('change-this-dev-secret')) {
    console.warn('[SECURITY WARNING] JWT_SECRET is using default dev secret! Please set a strong JWT_SECRET in .env.');
  }
}

module.exports = env;
