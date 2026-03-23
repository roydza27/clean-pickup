const AuthError = require('../shared/errors/AuthError');

/**
 * authorize — role check factory.
 * Usage: authorize('admin') or authorize('citizen', 'admin')
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthError('Authentication required', 401, 'TOKEN_REQUIRED'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthError('Insufficient permissions', 403, 'FORBIDDEN'));
    }
    next();
  };
}

module.exports = authorize;
