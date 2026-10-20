import { body, query, param } from 'express-validator';

/**
 * Validation rules for submitting assignment work
 */
export const submitWorkValidator = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Submission content or answer text is required'),
];

/**
 * Validation rules for mentor grading and feedback
 */
export const gradeSubmissionValidator = [
  body('grade')
    .notEmpty()
    .withMessage('Grade is required')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Grade must be a number between 0 and 100'),

  body('feedback')
    .optional()
    .trim(),
];

/**
 * Validation rules for querying paginated submissions
 */
export const submissionQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer greater than or equal to 1'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),

  query('courseId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('courseId must be a valid positive integer ID'),
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
  submitWorkValidator,
  gradeSubmissionValidator,
  submissionQueryValidator,
  idParamValidator,
};
