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
    message = error.constraint === 'glucose_readings_user_date_category_key'
      ? 'A reading already exists for this time slot on this date.'
      : 'A resource with that value already exists.';
  } else if (error.code === '23514') {
    statusCode = 400;
    if (error.constraint === 'glucose_readings_future_date') {
      message = 'Reading date cannot be in the future.';
    } else if (error.constraint === 'glucose_readings_max_four_per_day') {
      message = 'No more than four readings can be saved per day.';
    } else if (error.constraint === 'glucose_readings_duplicate_slot') {
      statusCode = 409;
      message = 'A reading already exists for this time slot on this date.';
    } else if (error.constraint === 'glucose_readings_value_range_check'
      || error.constraint === 'glucose_readings_glucose_value_check') {
      message = 'Glucose value must be a whole number between 40 and 600 mg/dL.';
    } else if (error.constraint === 'glucose_readings_measurement_category_check') {
      message = 'Choose a valid time slot.';
    } else {
      message = 'Reading does not meet the database validation requirements.';
    }
  } else if (error.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'A required service is unavailable.';
  } else if (error.code === '3D000') {
    statusCode = 503;
    message = 'The configured database is unavailable.';
  } else if (error.name === 'ZodError') {
    statusCode = 400;
    errors = error.issues.map(({ path, message: issueMessage }) => ({
      field: path.join('.'),
      message: issueMessage,
    }));
    message = errors.length
      ? `Request validation failed: ${errors.map(({ message: issueMessage }) => issueMessage).join(' ')}`
      : 'Request validation failed.';
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
