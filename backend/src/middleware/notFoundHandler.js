/**
 * 404 Not Found Middleware
 * Handles requests that do not match any defined route.
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export default notFoundHandler;
