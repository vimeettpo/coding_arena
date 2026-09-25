const { Pool } = require('pg');
const env = require('./env');

let pool = null;

function getPool() {
  if (!pool) {
    if (!env.databaseUrl || env.databaseUrl.includes('user:password@host')) {
      throw new Error(
        '\n======================================================\n' +
        '❌ [DATABASE_URL ERROR]: DATABASE_URL is missing or using placeholder in backend/.env!\n' +
        'Please configure a valid PostgreSQL connection string (e.g. from Neon.tech or local PostgreSQL) in backend/.env.\n' +
        '======================================================\n'
      );
    }

    pool = new Pool({
      connectionString: env.databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }
  return pool;
}

async function query(text, params) {
  const p = getPool();
  return p.query(text, params);
}

async function initPostgres() {
  const p = getPool();
  const client = await p.connect();
  try {
    console.log('Connecting to Neon PostgreSQL and initializing schema...');

    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        username VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
        college VARCHAR(255),
        avatar_url TEXT,
        email_verified BOOLEAN NOT NULL DEFAULT TRUE,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        approved BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
      CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users(LOWER(username));

      ALTER TABLE users ADD COLUMN IF NOT EXISTS college_id VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS branch VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS year SMALLINT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS teaching_domain VARCHAR(100);

      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token TEXT UNIQUE NOT NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

      CREATE TABLE IF NOT EXISTS allowed_email_domains (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        domain VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_allowed_email_domains_lower ON allowed_email_domains(LOWER(domain));

      INSERT INTO allowed_email_domains (domain)
      VALUES ('gmail.com'), ('googlemail.com'), ('codearena.com'), ('vimeet.ac.in')
      ON CONFLICT (domain) DO NOTHING;
    `);

    // Seed default admin and demo student if they do not exist
    const adminCheck = await client.query("SELECT id FROM users WHERE LOWER(email) = 'admin@gmail.com'");
    if (adminCheck.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const adminHash = await bcrypt.hash('Admin@123', 12);
      await client.query(
        `INSERT INTO users (name, username, email, password_hash, role, email_verified, enabled, approved, created_at, updated_at)
         VALUES ('System Administrator', 'admin', 'admin@gmail.com', $1, 'ADMIN', TRUE, TRUE, TRUE, NOW(), NOW())
         ON CONFLICT (email) DO NOTHING`,
        [adminHash]
      );
    }

    const studentCheck = await client.query("SELECT id FROM users WHERE LOWER(email) = 'student@gmail.com'");
    if (studentCheck.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const studentHash = await bcrypt.hash('Student@123', 12);
      await client.query(
        `INSERT INTO users (name, username, email, password_hash, role, college, branch, year, email_verified, enabled, approved, created_at, updated_at)
         VALUES ('Demo Student', 'student', 'student@gmail.com', $1, 'STUDENT', 'Vishwaniketan iMEET', 'Computer Engineering', 3, TRUE, TRUE, TRUE, NOW(), NOW())
         ON CONFLICT (email) DO NOTHING`,
        [studentHash]
      );
    }

    console.log('Neon PostgreSQL connected and schema verified successfully.');
  } finally {
    client.release();
  }
}

module.exports = {
  getPool,
  query,
  initPostgres,
};
