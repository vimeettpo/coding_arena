const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Short-lived access token carrying id/email/role/name claims so the
 * frontend can decode identity client-side — mirrors generateAccessToken.
 */
function generateAccessToken(user) {
  return jwt.sign(
    { email: user.email, name: user.name, role: user.role },
    env.jwt.secret,
    { subject: String(user.id), expiresIn: Math.floor(env.jwt.accessTokenExpiryMs / 1000) }
  );
}

/** Long-lived refresh token — mirrors generateRefreshToken. */
function generateRefreshToken(user) {
  return jwt.sign(
    { type: 'refresh' },
    env.jwt.secret,
    { subject: String(user.id), expiresIn: Math.floor(env.jwt.refreshTokenExpiryMs / 1000) }
  );
}

function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret);
}

module.exports = { generateAccessToken, generateRefreshToken, verifyToken };
