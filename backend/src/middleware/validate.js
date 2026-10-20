import { validationResult } from 'express-validator';

/**
 * Request validation middleware
 * Inspects express-validator results on the incoming request.
 * If validation errors exist, halts request processing and returns 400 with details.
 */
export function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
}

export default validateRequest;
