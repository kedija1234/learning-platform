import { body, query, param } from 'express-validator';

/**
 * Validation rules for creating/updating a course
 */
export const courseValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Course title is required')
    .isLength({ max: 255 })
    .withMessage('Course title cannot exceed 255 characters'),

  body('description')
    .optional()
    .trim(),
];

/**
 * Validation rules for creating a course resource
 */
export const resourceValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Resource title is required')
    .isLength({ max: 255 })
    .withMessage('Resource title cannot exceed 255 characters'),

  body('link_or_text')
    .trim()
    .notEmpty()
    .withMessage('Resource link or content text is required'),
];

/**
 * Validation rules for creating a course assignment
 */
export const assignmentValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Assignment title is required')
    .isLength({ max: 255 })
    .withMessage('Assignment title cannot exceed 255 characters'),

  body('instructions')
    .trim()
    .notEmpty()
    .withMessage('Assignment instructions are required'),

  body('due_date')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Due date must be a valid ISO8601 date (e.g. YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)'),
];

/**
 * Validation rules for querying paginated courses
 */
export const courseListQueryValidator = [
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
 * Validation rules for numeric ID parameter in URL path
 */
export const idParamValidator = (paramName = 'id') => [
  param(paramName)
    .isInt({ min: 1 })
    .withMessage(`${paramName} must be a valid positive integer ID`),
];

export default {
  courseValidator,
  resourceValidator,
  assignmentValidator,
  courseListQueryValidator,
  idParamValidator,
};
