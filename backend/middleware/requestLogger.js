const logger = require('../shared/utils/logger');

/**
 * requestLogger — structured Winston JSON request logging.
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP request', {
      method:     req.method,
      url:        req.originalUrl,
      statusCode: res.statusCode,
      duration,
      userId:     req.user?.userId,
      ip:         req.ip,
      userAgent:  req.get('user-agent'),
    });
  });

  next();
}

module.exports = requestLogger;
