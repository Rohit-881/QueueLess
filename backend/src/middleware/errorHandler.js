/**
 * Centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  let statusCode = err.statusCode || 500;
  let code = err.code || 'SERVER_ERROR';

  // Log error during development
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${err.name || 'AppError'}: ${err.message}`, err.stack ? err.stack.split('\n')[1] : '');
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    error.message = `Resource not found with id: ${err.value}`;
    code = 'INVALID_ID';
  }

  // Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const keys = Object.keys(err.keyPattern || {});
    if (keys.includes('userId') && keys.includes('queueSessionId')) {
      error.message = 'You already have an active or waiting token in this queue.';
      code = 'DUPLICATE_ACTIVE_TOKEN';
    } else if (keys.includes('email')) {
      error.message = 'An account with this email address already exists.';
      code = 'DUPLICATE_EMAIL';
    } else {
      error.message = `Duplicate field value entered for: ${keys.join(', ')}`;
      code = 'DUPLICATE_RESOURCE';
    }
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 422;
    const messages = Object.values(err.errors).map((val) => val.message);
    error.message = messages.join('. ');
    code = 'VALIDATION_ERROR';
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    error.message = 'Invalid authentication token.';
    code = 'INVALID_TOKEN';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    error.message = 'Authentication token has expired.';
    code = 'TOKEN_EXPIRED';
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || 'An internal server error occurred',
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
