const ValidationError = require('../shared/errors/ValidationError');

/**
 * validateRequest — Zod schema runner middleware factory.
 * Usage: validateRequest(myZodSchema)
 *
 * Validates req.body by default. Pass { source: 'query' } to validate req.query.
 */
function validateRequest(schema, options = {}) {
  const source = options.source || 'body';
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field:   issue.path.join('.'),
        message: issue.message,
      }));
      return next(new ValidationError('Validation failed', details));
    }
    req[source] = result.data; // Replace with coerced/default-filled data
    next();
  };
}

module.exports = validateRequest;
