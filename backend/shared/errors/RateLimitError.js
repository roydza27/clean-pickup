const AppError = require('./AppError');

class RateLimitError extends AppError {
  constructor(message = 'Too many requests', errorCode = 'RATE_LIMIT_EXCEEDED') {
    super(message, 429, errorCode);
  }
}

module.exports = RateLimitError;
