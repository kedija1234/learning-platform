import { body } from 'express-validator';

/**
 * Validation rules for user registration
 */
export const registerValidator = [
  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 100 })
    .withMessage('First name cannot exceed 100 characters'),

  body('last_name')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 100 })
    .withMessage('Last name cannot exceed 100 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail({ all_lowercase: true }),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body('role')
    .optional()
    .trim()
    .isIn(['student', 'mentor', 'coordinator'])
    .withMessage('Role must be one of: student, mentor, coordinator (admin cannot self-register)'),
];

/**
 * Validation rules for user login
 */
export const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail({ all_lowercase: true }),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export default { registerValidator, loginValidator };
