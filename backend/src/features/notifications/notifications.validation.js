import { query, param } from 'express-validator';

/**
 * Validation rules for listing notifications
 */
export const listNotificationsQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer greater than or equal to 1'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),

  query('unreadOnly')
    .optional()
    .isBoolean()
    .withMessage('unreadOnly must be a boolean (true or false)'),
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
  listNotificationsQueryValidator,
  idParamValidator,
};
