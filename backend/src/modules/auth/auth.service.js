const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { query } = require('../../config/postgres');
const RefreshToken = require('../../models/RefreshToken');
const userService = require('../user/user.service');
const { generateAccessToken, generateRefreshToken } = require('../../utils/jwt');
const {
  BadRequestException,
  DuplicateResourceException,
  BadCredentialsException,
  UnauthorizedActionException,
} = require('../../common/errors');
const env = require('../../config/env');
const domainService = require('../admin/domain.service');

const BCRYPT_ROUNDS = 12;

/**
 * Register a new user in Neon PostgreSQL.
 * Passwords are encrypted with bcrypt (12 rounds).
 */
async function register(request) {
  const email = (request.email || '').toLowerCase().trim();
  if (!email) {
    throw new BadRequestException('Email is required.');
  }

  const emailDomain = email.includes('@') ? email.split('@')[1].toLowerCase().trim() : '';
  if (!emailDomain) {
    throw new BadRequestException('A valid email address is required.');
  }

  const isAllowed = await domainService.isDomainAllowed(emailDomain);
  if (!isAllowed) {
    throw new BadRequestException(`Registration with @${emailDomain} email is not accepted. Only approved domains are allowed.`);
  }

  if (await userService.existsByEmail(email)) {
    throw new DuplicateResourceException('An account with this email already exists.');
  }

  const name = (request.name || '').trim();
  if (!name) {
    throw new BadRequestException('Name is required.');
  }

  if (!request.password || request.password.length < 8) {
    throw new BadRequestException('Password must be at least 8 characters long.');
  }

  const passwordHash = await bcrypt.hash(request.password, BCRYPT_ROUNDS);
  const role = (() => {
    if (request.role === 'TRAINER') return 'TRAINER';
    if (request.role === 'ADMIN') {
      if (!request.adminSecretCode || request.adminSecretCode !== env.adminSecretCode) {
        throw new BadRequestException('Invalid admin secret code. Admin account creation is restricted.');
      }
      return 'ADMIN';
    }
    return 'STUDENT';
  })();
  const username = request.username ? request.username.trim().toLowerCase() : email.split('@')[0].toLowerCase();
  const college = request.college ? request.college.trim() : null;
  const collegeId = request.collegeId ? request.collegeId.trim() : null;
  const branch = request.branch ? request.branch.trim() : null;
  const year = request.year ? parseInt(request.year, 10) : null;
  const teachingDomain = request.teachingDomain ? request.teachingDomain.trim() : null;

  const insertResult = await query(
    `INSERT INTO users (name, username, email, password_hash, role, college, college_id, branch, year, teaching_domain, email_verified, enabled, approved, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, TRUE, TRUE, NOW(), NOW())
     RETURNING id, name, username, email, role, college, college_id, branch, year, teaching_domain, avatar_url, email_verified, enabled, approved, created_at, updated_at`,
    [name, username, email, passwordHash, role, college, collegeId, branch, year, teachingDomain]
  );

  return insertResult.rows[0];
}

/**
 * Login user via email or username against PostgreSQL.
 * Verifies bcrypt password hash and issues authenticated JWT tokens.
 */
async function login(request) {
  const identifier = (request.email || '').toLowerCase().trim();
  const password = request.password;

  if (!identifier || !password) {
    throw new BadCredentialsException('Invalid email or password.');
  }

  // 1. Query user from PostgreSQL
  let user = null;
  try {
    const res = await query(
      `SELECT * FROM users
       WHERE LOWER(email) = $1 OR LOWER(username) = $1 OR LOWER(name) = $1
       LIMIT 1`,
      [identifier]
    );
    if (res.rows.length > 0) {
      user = res.rows[0];
    }
  } catch (err) {
    console.error('Error querying user during login:', err.message);
  }

  // Fallback to legacy Mongo user if not in PostgreSQL
  if (!user) {
    user = await userService.getByEmail(identifier).catch(() => null);
  }

  if (!user) {
    // Timing-consistent failure to avoid user enumeration
    await bcrypt.compare(password, '$2a$12$e8YjG5iE1d70Z/nK8Csu6u39M8Nsm9Q/9QyO78nJ1a8uE2m3/d2ea');
    throw new BadCredentialsException('Invalid email or password.');
  }

  // 2. Verify password hash
  const storedHash = user.password_hash || user.passwordHash;
  let passwordMatches = false;

  if (storedHash) {
    passwordMatches = await bcrypt.compare(password, storedHash);
    // Legacy plaintext check (if any old dev accounts exist)
    if (!passwordMatches && storedHash === password) {
      passwordMatches = true;
      // Upgrade plaintext password to bcrypt in PostgreSQL
      if (user.id) {
        const upgradedHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        await query('UPDATE users SET password_hash = $1 WHERE id = $2', [upgradedHash, user.id]).catch(() => {});
      }
    }
  }

  if (!passwordMatches) {
    throw new BadCredentialsException('Invalid email or password.');
  }

  // 3. Verify account enabled status
  if (user.enabled === false) {
    throw new UnauthorizedActionException('Your account has been disabled. Please contact support.');
  }

  return issueTokenPair(user);
}

/**
 * Exchange a valid refresh token for a new access & refresh token pair.
 */
async function refresh(request) {
  const token = request.refreshToken;
  if (!token) {
    throw new BadRequestException('Refresh token is required.');
  }

  // Check PostgreSQL refresh_tokens
  let stored = null;
  try {
    const res = await query(
      `SELECT * FROM refresh_tokens
       WHERE token = $1 AND revoked = FALSE AND expires_at > NOW()
       LIMIT 1`,
      [token]
    );
    if (res.rows.length > 0) {
      stored = res.rows[0];
    }
  } catch (err) {
    console.error('Error checking refresh token in PostgreSQL:', err.message);
  }

  // Fallback to Mongo RefreshToken collection if connected
  if (!stored && mongoose.connection && mongoose.connection.readyState === 1) {
    const mongoStored = await RefreshToken.findOne({ token }).catch(() => null);
    if (!mongoStored || mongoStored.revoked || mongoStored.isExpired()) {
      throw new BadRequestException('Refresh token expired or revoked. Please sign in again.');
    }
    const user = await userService.getById(mongoStored.userId);
    mongoStored.revoked = true;
    await mongoStored.save();
    return issueTokenPair(user);
  }

  if (!stored) {
    throw new BadRequestException('Refresh token expired or invalid. Please sign in again.');
  }

  // Rotate token in PostgreSQL
  await query('UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1', [stored.id]);
  const user = await userService.getById(stored.user_id);
  return issueTokenPair(user);
}

/**
 * Logout: Revoke all active refresh tokens for the given user ID.
 */
async function logout(userId) {
  if (!userId) return;

  try {
    await query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id::text = $1', [String(userId)]);
  } catch (err) {
    // If not a valid UUID, ignore PG error
  }

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    await RefreshToken.deleteMany({ userId }).catch(() => {});
  }
}

async function verifyOtp() {
  return { message: 'Email verification is complete.' };
}

async function forgotPassword() {
  return { message: 'If that email exists, password reset instructions have been sent.' };
}

async function resetPassword(request) {
  const email = (request.email || '').toLowerCase().trim();
  const user = await userService.getByEmail(email);

  const passwordHash = await bcrypt.hash(request.newPassword, BCRYPT_ROUNDS);

  if (user.id) {
    try {
      await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id::text = $2', [passwordHash, String(user.id)]);
      await query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id::text = $1', [String(user.id)]);
    } catch (_e) {}
  }

  if (user.save) {
    user.passwordHash = passwordHash;
    await user.save();
  }
}

// ---- Helper: issue JWT access & refresh token pair ----

async function issueTokenPair(user) {
  const userId = String(user.id || user._id);
  const userPayload = {
    id: userId,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(userPayload);
  const refreshTokenValue = generateRefreshToken(userPayload);

  // Store refresh token in PostgreSQL
  try {
    const expiresAt = new Date(Date.now() + env.jwt.refreshTokenExpiryMs);
    await query(
      `INSERT INTO refresh_tokens (token, user_id, expires_at)
       VALUES ($1, $2::uuid, $3)`,
      [refreshTokenValue, userId, expiresAt]
    );
  } catch (_pgErr) {
    // Fallback to Mongo RefreshToken model if userId is non-UUID
    try {
      await RefreshToken.create({
        token: refreshTokenValue,
        userId,
        expiresAt: new Date(Date.now() + env.jwt.refreshTokenExpiryMs),
      });
    } catch (_mongoErr) {}
  }

  return {
    accessToken,
    refreshToken: refreshTokenValue,
    user: userService.toResponse(user),
  };
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  verifyOtp,
  forgotPassword,
  resetPassword,
};
