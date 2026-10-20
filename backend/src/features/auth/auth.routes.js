import { Router } from 'express';
import * as authController from './auth.controller.js';
import { registerValidator, loginValidator } from './auth.validation.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account (student, mentor, or coordinator)
 * @access  Public
 */
router.post(
  '/register',
  registerValidator,
  validateRequest,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user credentials and return JWT
 * @access  Public
 */
router.post(
  '/login',
  loginValidator,
  validateRequest,
  authController.login
);

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged-in user profile
 * @access  Private (Requires valid JWT Bearer token)
 */
router.get(
  '/me',
  authenticateToken,
  authController.getMe
);

export default router;
