const AppError = require('./AppError');

class AuthError extends AppError {
  constructor(message = 'Unauthorized', statusCode = 401, errorCode = 'UNAUTHORIZED') {
    super(message, statusCode, errorCode);
  }
}

module.exports = AuthError;
