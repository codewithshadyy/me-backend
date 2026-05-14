

'use strict';

/**
 * 404 — Not Found handler
 */
const notFound = (req, res, _next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message    = err.message || 'Internal server error';
  let errors     = null;

  // ── Mongoose Validation Error ─────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message    = 'Validation failed';
    errors     = Object.values(err.errors).map((e) => ({
      field  : e.path,
      message: e.message,
    }));
  }

  // ── Mongoose Cast Error (bad ObjectId) ─────────────────
  else if (err.name === 'CastError') {
    statusCode = 400;
    message    = `Invalid ${err.path}: '${err.value}'`;
  }

  // ── Mongoose Duplicate Key ─────────────────────────────
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message     = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // ── JWT Errors ─────────────────────────────────────────
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message    = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message    = 'Token expired';
  }

  // ── Multer / File Upload Errors ────────────────────────
  else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message    = `File too large. Max size: ${Math.round(parseInt(process.env.MAX_FILE_SIZE) / 1024 / 1024)}MB`;
  } else if (err.code === 'LIMIT_FILE_COUNT') {
    statusCode = 400;
    message    = 'Too many files uploaded at once';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message    = `Unexpected file field: ${err.field}`;
  }

  // ── Log in development ─────────────────────────────────
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.error(`  Status: ${statusCode}`);
    console.error(`  Error : ${message}`);
    if (err.stack) console.error(err.stack);
  }

  const payload = {
    success   : false,
    message,
    statusCode,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(payload);
};

/**
 * Async wrapper — eliminates try/catch boilerplate
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name       = 'ApiError';
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { notFound, errorHandler, asyncHandler, ApiError };