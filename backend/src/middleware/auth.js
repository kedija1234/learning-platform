import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_12345_local_testing_only';

/**
 * Authentication Middleware
 * Validates the JWT Bearer token in the Authorization header.
 * Attaches decoded user payload (id, email, role) to req.user.
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: No or malformed token provided',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, iat, exp }
    next();
  } catch (error) {
    const message = error.name === 'TokenExpiredError' 
      ? 'Session expired. Please log in again.' 
      : 'Invalid authentication token.';
    return res.status(401).json({
      success: false,
      message,
    });
  }
}

/**
 * Role-Based Authorization Middleware
 * Verifies that the authenticated user possesses one of the required roles.
 * Must be used AFTER authenticateToken middleware.
 *
 * @param {...string} allowedRoles - Array or rest params of permitted roles
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to authorization check',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: This resource requires one of [${allowedRoles.join(', ')}] role`,
      });
    }

    next();
  };
}

export default { authenticateToken, requireRole };
