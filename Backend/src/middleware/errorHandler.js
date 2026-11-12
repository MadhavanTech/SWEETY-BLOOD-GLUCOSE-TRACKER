const AppError = require('../utils/AppError');
function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = 500;
  let message = 'Internal server error.';
  let errors;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errors = error.details;
  } else if (error.type === 'entity.parse.failed' || error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    message = 'Invalid JSON body.';
  } else if (error.code === '23505') {
    statusCode = 409;
    message = 'A resource with that value already exists.';
  } else if (error.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'A required service is unavailable.';
  } else if (error.code === '3D000') {
    statusCode = 503;
    message = 'The configured database is unavailable.';
  } else if (error.name === 'ZodError') {
    statusCode = 400;
    message = 'Request validation failed.';
    errors = error.issues.map(({ path, message: issueMessage }) => ({
      field: path.join('.'),
      message: issueMessage,
    }));
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  const response = { success: false, message };
  if (errors !== undefined) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
}

module.exports = errorHandler;
