/**
 * Central Error-Handling Middleware
 * Catches all errors forwarded via next(err) or thrown in async route handlers in Express 5.
 * Always returns consistent JSON responses to the client.
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  // Log error details for server diagnostics
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || undefined,
    // Include stack trace only in non-production environments
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

export default errorHandler;
