const AppError = require('../shared/errors/AppError');
const ValidationError = require('../shared/errors/ValidationError');
const AuthError = require('../shared/errors/AuthError');
const NotFoundError = require('../shared/errors/NotFoundError');
const ConflictError = require('../shared/errors/ConflictError');
const RateLimitError = require('../shared/errors/RateLimitError');
const logger = require('../shared/utils/logger');

/**
 * errorHandler — centralised error → HTTP response mapping.
 * Must be the last middleware registered in Express.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Operational errors (known, safe to expose message)
  if (err instanceof AppError && err.isOperational) {
    const body = {
      success:   false,
      errorCode: err.errorCode,
      message:   err.message,
    };
    if (err instanceof ValidationError && err.details?.length) {
      body.details = err.details;
    }
    return res.status(err.statusCode).json(body);
  }

  // PostgreSQL unique violation → 409
  if (err.code === '23505') {
    return res.status(409).json({
      success:   false,
      errorCode: 'CONFLICT',
      message:   'A record with these details already exists.',
    });
  }

  // PostgreSQL foreign key violation → 409
  if (err.code === '23503') {
    return res.status(409).json({
      success:   false,
      errorCode: 'FOREIGN_KEY_VIOLATION',
      message:   'Referenced record does not exist.',
    });
  }

  // JWT errors (shouldn't reach here after authenticate, but just in case)
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success:   false,
      errorCode: 'TOKEN_EXPIRED',
      message:   'Token expired.',
    });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success:   false,
      errorCode: 'TOKEN_INVALID',
      message:   'Invalid token.',
    });
  }

  // Unknown / programming errors — never expose internal details
  logger.error('Unhandled error', {
    error:   err.message,
    stack:   err.stack,
    url:     req?.originalUrl,
    method:  req?.method,
    userId:  req?.user?.userId,
  });

  return res.status(500).json({
    success:   false,
    errorCode: 'INTERNAL_ERROR',
    message:   'An unexpected error occurred. Please try again later.',
  });
}

module.exports = errorHandler;
