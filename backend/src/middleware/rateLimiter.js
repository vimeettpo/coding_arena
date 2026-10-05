const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for login:
 * - Window: 1 minute (60,000 ms)
 * - Limit: 5 failed attempts per IP
 * - skipSuccessfulRequests: true (only failed attempts consume the limit)
 * - Returns clear 429 response message.
 */
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many failed login attempts. Please wait 1 minute before trying again.',
  },
});

/**
 * Rate limiter for registration:
 * - Window: 15 minutes
 * - Limit: 10 registrations per IP
 * - Blocks bot floods and malicious mass account registrations.
 */
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many accounts created from this IP. Please try again after 15 minutes.',
  },
});

module.exports = {
  loginLimiter,
  registerLimiter,
};
