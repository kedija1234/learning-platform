import { Router } from 'express';
import * as adminController from './admin.controller.js';
import {
  listUsersQueryValidator,
  updateStatusValidator,
  updateRoleValidator,
  idParamValidator,
} from './admin.validation.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';

const router = Router();

// Strictly enforce administrator authentication on all admin endpoints
router.use(authenticateToken, requireRole('admin'));

/**
 * @route   GET /api/admin/users
 * @desc    List all users with pagination, search, and filters
 * @access  Private (admin only)
 */
router.get(
  '/users',
  listUsersQueryValidator,
  validateRequest,
  adminController.listUsers
);

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Deactivate or reactivate a user account
 * @access  Private (admin only)
 */
router.put(
  '/users/:id/status',
  idParamValidator('id'),
  updateStatusValidator,
  validateRequest,
  adminController.updateStatus
);

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Change user role (student, mentor, coordinator, admin)
 * @access  Private (admin only)
 */
router.put(
  '/users/:id/role',
  idParamValidator('id'),
  updateRoleValidator,
  validateRequest,
  adminController.updateRole
);

/**
 * @route   GET /api/admin/stats
 * @desc    Platform-wide statistics and metrics
 * @access  Private (admin only)
 */
router.get('/stats', adminController.getStats);

export default router;
