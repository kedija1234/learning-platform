import cors from 'cors';

/**
 * Computes allowed origins list based on FRONTEND_URL and NODE_ENV
 */
export function getAllowedOrigins() {
  const allowed = new Set();

  // Always allow standard local Vite ports during development
  if (process.env.NODE_ENV !== 'production') {
    allowed.add('http://localhost:5173');
    allowed.add('http://localhost:5174');
  }

  // Parse comma-separated URLs from FRONTEND_URL environment variable
  if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim() !== '') {
    const list = process.env.FRONTEND_URL.split(',')
      .map((item) => item.trim().replace(/\/+$/, ''))
      .filter(Boolean);
    for (const url of list) {
      allowed.add(url);
    }
  }

  return allowed;
}

/**
 * Express CORS middleware with strict origin whitelist validation
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests without Origin header (curl, mobile apps, server-to-server, unit tests)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = getAllowedOrigins();
    const normalizedOrigin = origin.trim().replace(/\/+$/, '');

    if (allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }

    const error = new Error(`CORS policy violation: Origin '${origin}' is not allowed`);
    error.statusCode = 403;
    return callback(error);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

export default corsMiddleware;
