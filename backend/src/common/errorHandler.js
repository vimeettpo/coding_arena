const { AppError, ValidationException } = require('./errors');

/**
 * Every thrown error lands here and comes back out in the same shape, so
 * the frontend never has to special-case error parsing per endpoint —
 * mirrors GlobalExceptionHandler.java's ErrorResponse envelope.
 */
function errorHandler(err, req, res, _next) {
  if (err instanceof ValidationException) {
    return res.status(400).json({
      message: err.message,
      status: 400,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
      fieldErrors: err.fieldErrors,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      message: err.message,
      status: err.status,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }

  // JWT library errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Authentication required to access this resource.',
      status: 401,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({
      message: 'A record with a matching unique field already exists.',
      status: 409,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }

  console.error(`Unexpected exception on ${req.originalUrl}:`, err);
  return res.status(500).json({
    message: 'Something went wrong. Please try again.',
    status: 500,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    message: `No handler found for ${req.method} ${req.originalUrl}`,
    status: 404,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
}

module.exports = { errorHandler, notFoundHandler };
