import { Router } from 'express';
import * as assistantController from './assistant.controller.js';
import { askQuestionValidator } from './assistant.validation.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

// In-memory rate limiting store: userId -> array of timestamps within 60s
const userRequestsMap = new Map();

/**
 * Rate limiting middleware: max 10 requests per minute per user
 */
export function rateLimitAssistant(req, res, next) {
  const userId = req.user?.id;
  if (!userId) {
    return next();
  }

  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  const timestamps = (userRequestsMap.get(userId) || []).filter(
    (timestamp) => now - timestamp < windowMs
  );

  if (timestamps.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. You can only ask up to 10 questions per minute. Please try again later.',
    });
  }

  timestamps.push(now);
  userRequestsMap.set(userId, timestamps);

  // Prevent memory leaks if many users query
  if (userRequestsMap.size > 1000) {
    for (const [uid, times] of userRequestsMap.entries()) {
      const active = times.filter((t) => now - t < windowMs);
      if (active.length === 0) {
        userRequestsMap.delete(uid);
      } else {
        userRequestsMap.set(uid, active);
      }
    }
  }

  next();
}

/**
 * Reset rate limits store (useful for tests)
 */
export function resetRateLimits() {
  userRequestsMap.clear();
}

/**
 * @route   POST /api/assistant/ask
 * @desc    Submit a study question to the AI assistant
 * @access  Private (any authenticated user)
 */
router.post(
  '/ask',
  authenticateToken,
  rateLimitAssistant,
  askQuestionValidator,
  validateRequest,
  assistantController.ask
);

export default router;
