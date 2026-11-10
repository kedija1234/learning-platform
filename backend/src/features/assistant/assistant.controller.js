import * as assistantService from './assistant.service.js';

/**
 * Controller to handle AI Study Assistant questions
 * POST /api/assistant/ask
 */
export async function ask(req, res, next) {
  try {
    const { question } = req.body;
    const answer = await assistantService.askQuestion(question);

    return res.status(200).json({
      success: true,
      data: {
        answer,
      },
    });
  } catch (error) {
    if (error.statusCode === 503) {
      return res.status(503).json({
        success: false,
        message: 'The study assistant is not set up yet.',
      });
    }
    if (error.statusCode === 502) {
      return res.status(502).json({
        success: false,
        message: 'The study assistant is not available right now. Please try again later.',
      });
    }
    next(error);
  }
}

export default {
  ask,
};
