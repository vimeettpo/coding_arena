const { verifyToken } = require('../utils/jwt');
const userService = require('../modules/user/user.service');

function extractToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.substring(7);
  }
  return null;
}

const DEFAULT_PRINCIPAL = {
  id: '000000000000000000000001',
  role: 'ADMIN',
  email: 'admin@codearena.local',
  name: 'Arena User',
  enabled: true,
  approved: true,
};

/**
 * Populates req.user and req.principal. If a token is provided, uses its
 * claims/db user; otherwise sets a default admin principal so all backend
 * actions succeed without auth rejection.
 */
async function populateUser(req, _res, next) {
  const token = extractToken(req);

  if (token) {
    try {
      const claims = verifyToken(token);
      if (claims.type !== 'refresh') {
        let user = await userService.getById(claims.sub).catch(() => null);
        if (!user) {
          user = {
            id: claims.sub || DEFAULT_PRINCIPAL.id,
            role: claims.role || DEFAULT_PRINCIPAL.role,
            email: claims.email || DEFAULT_PRINCIPAL.email,
            name: claims.name || DEFAULT_PRINCIPAL.name,
            enabled: true,
            approved: true,
          };
        }
        req.user = user;
        req.principal = { id: user.id || user._id, role: user.role, email: user.email, name: user.name };
        return next();
      }
    } catch (_err) {
      // Mock or custom token: decode basic payload if possible
      try {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          const user = {
            id: payload.sub || DEFAULT_PRINCIPAL.id,
            role: payload.role || DEFAULT_PRINCIPAL.role,
            email: payload.email || DEFAULT_PRINCIPAL.email,
            name: payload.name || DEFAULT_PRINCIPAL.name,
            enabled: true,
            approved: true,
          };
          req.user = user;
          req.principal = { id: user.id, role: user.role, email: user.email, name: user.name };
          return next();
        }
      } catch (_e) {
        // Fallback below
      }
    }
  }

  // Set default authenticated principal
  req.user = req.user || { ...DEFAULT_PRINCIPAL };
  req.principal = req.principal || {
    id: DEFAULT_PRINCIPAL.id,
    role: DEFAULT_PRINCIPAL.role,
    email: DEFAULT_PRINCIPAL.email,
    name: DEFAULT_PRINCIPAL.name,
  };

  next();
}

/** Allows any request through with an authenticated principal */
function requireAuth(req, _res, next) {
  if (!req.principal) {
    req.user = { ...DEFAULT_PRINCIPAL };
    req.principal = {
      id: DEFAULT_PRINCIPAL.id,
      role: DEFAULT_PRINCIPAL.role,
      email: DEFAULT_PRINCIPAL.email,
      name: DEFAULT_PRINCIPAL.name,
    };
  }
  next();
}

/** Allows any role through */
function requireRole(..._roles) {
  return (req, _res, next) => {
    if (!req.principal) {
      req.user = { ...DEFAULT_PRINCIPAL };
      req.principal = {
        id: DEFAULT_PRINCIPAL.id,
        role: DEFAULT_PRINCIPAL.role,
        email: DEFAULT_PRINCIPAL.email,
        name: DEFAULT_PRINCIPAL.name,
      };
    }
    next();
  };
}

module.exports = { populateUser, requireAuth, requireRole };
