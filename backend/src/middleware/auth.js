const { verifyToken } = require('../utils/jwt');
const userService = require('../modules/user/user.service');
const { BadCredentialsException, UnauthorizedActionException } = require('../common/errors');

function extractToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.substring(7);
  }
  return null;
}

/**
 * Populates req.user and req.principal if a valid Bearer JWT is provided.
 * If unauthenticated or token is invalid, sets req.user and req.principal to null.
 */
async function populateUser(req, _res, next) {
  const token = extractToken(req);

  req.user = null;
  req.principal = null;

  if (token) {
    try {
      const claims = verifyToken(token);
      if (claims && claims.type !== 'refresh' && claims.sub) {
        let user = await userService.getById(claims.sub).catch(() => null);
        if (user && user.enabled !== false) {
          req.user = user;
          req.principal = {
            id: String(user.id || user._id),
            role: user.role,
            email: user.email,
            name: user.name,
          };
          return next();
        }
      }
    } catch (_err) {
      // Invalid or expired token: req.principal remains null
    }
  }

  next();
}

/**
 * Enforces authentication. Throws 401 if unauthenticated.
 */
function requireAuth(req, _res, next) {
  if (!req.principal) {
    throw new BadCredentialsException('Authentication required to access this resource.');
  }
  next();
}

/**
 * Enforces role-based authorization. Throws 403 if role is not authorized.
 */
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.principal) {
      throw new BadCredentialsException('Authentication required to access this resource.');
    }
    if (roles.length > 0 && !roles.includes(req.principal.role)) {
      throw new UnauthorizedActionException('You do not have permission to access this resource.');
    }
    next();
  };
}

module.exports = { populateUser, requireAuth, requireRole };
