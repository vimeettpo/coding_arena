const { ValidationException } = require('../common/errors');

/**
 * Validates req.body against a zod schema. On failure, throws a
 * ValidationException shaped like Java's @Valid + MethodArgumentNotValidException
 * handling: { field: message }.
 */
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path.join('.') || 'body';
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      throw new ValidationException(fieldErrors);
    }
    req.body = result.data;
    next();
  };
}

module.exports = { validateBody };
