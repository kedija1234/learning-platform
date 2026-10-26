import { body, query, param } from 'express-validator';

export const listUsersQueryValidator = [
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

  query('role')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(['student', 'mentor', 'coordinator', 'admin'])
    .withMessage('Role filter must be one of: student, mentor, coordinator, admin'),

  query('is_active')
    .optional()
    .custom((value) => {
      if (['true', 'false', '1', '0'].includes(String(value).toLowerCase())) {
        return true;
      }
      throw new Error('is_active must be true or false');
    }),
];

export const updateStatusValidator = [
  body('is_active')
    .notEmpty()
    .withMessage('is_active is required')
    .isBoolean()
    .withMessage('is_active must be a boolean (true or false)'),
];

export const updateRoleValidator = [
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['student', 'mentor', 'coordinator', 'admin'])
    .withMessage('Role must be one of: student, mentor, coordinator, admin'),
];

export const idParamValidator = (paramName = 'id') => [
  param(paramName)
    .isInt({ min: 1 })
    .withMessage(`${paramName} must be a valid positive integer ID`),
];

export default {
  listUsersQueryValidator,
  updateStatusValidator,
  updateRoleValidator,
  idParamValidator,
};
