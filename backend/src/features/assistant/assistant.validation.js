import { body } from 'express-validator';

/**
 * Validation rules for asking a study assistant question
 * POST /api/assistant/ask
 * Body: { "question": string }, 3 to 500 characters
 */
export const askQuestionValidator = [
  body('question')
    .isString()
    .withMessage('Question must be a string')
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Question must be between 3 and 500 characters'),
];

export default {
  askQuestionValidator,
};
