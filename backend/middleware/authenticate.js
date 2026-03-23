const jwt = require('jsonwebtoken');
const { getRedisClient } = require('../config/redis');
const AuthError = require('../shared/errors/AuthError');
const logger = require('../shared/utils/logger');

/**
 * authenticate — verifies JWT token and active Redis session.
 * Attaches req.user = { userId, role, phoneNumber } on success.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('Authorization token required', 401, 'TOKEN_REQUIRED');
    }

    const token = authHeader.split(' ')[1];

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AuthError('Token expired', 401, 'TOKEN_EXPIRED');
      }
      throw new AuthError('Invalid token', 401, 'TOKEN_INVALID');
    }

    const redis = getRedisClient();
    const sessionKey = `session:${payload.userId}`;
    const session = await redis.get(sessionKey);
    if (!session) {
      throw new AuthError('Session expired or invalidated', 401, 'SESSION_INVALID');
    }

    req.user = {
      userId:      payload.userId,
      role:        payload.role,
      phoneNumber: payload.phoneNumber,
    };
    // Backward compat — some controllers use req.userId
    req.userId = payload.userId;
    req.userRole = payload.role;

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticate;
