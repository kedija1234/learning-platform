import { body, query, param } from 'express-validator';

/**
 * Validation rules for creating a new internship posting
 */
export const createInternshipValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Internship title is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),

  body('organization_name')
    .trim()
    .notEmpty()
    .withMessage('Organization or company name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Organization name must be between 2 and 255 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Internship description is required')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),

  body('deadline')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Deadline must be a valid ISO 8601 date string'),
];

/**
 * Validation rules for updating an internship posting
 */
export const updateInternshipValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),

  body('organization_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Organization name must be between 2 and 255 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),

  body('deadline')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Deadline must be a valid ISO 8601 date string'),
];

/**
 * Validation rules for querying internship listings
 */
export const listInternshipsQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer greater than or equal to 1'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),

  query('search')
    .optional()
    .trim(),
];

/**
 * Validation rules for updating application status (accepted / rejected)
 */
export const updateApplicationStatusValidator = [
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['accepted', 'rejected'])
    .withMessage('Status must be either "accepted" or "rejected"'),
];

/**
 * Validation rules for numeric ID parameter in URL path
 */
export const idParamValidator = (paramName = 'id') => [
  param(paramName)
    .isInt({ min: 1 })
    .withMessage(`${paramName} must be a valid positive integer ID`),
];

export default {
  createInternshipValidator,
  updateInternshipValidator,
  listInternshipsQueryValidator,
  updateApplicationStatusValidator,
  idParamValidator,
};
