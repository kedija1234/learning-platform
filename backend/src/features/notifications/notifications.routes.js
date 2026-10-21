import { Router } from 'express';
import * as notificationsController from './notifications.controller.js';
import {
  listNotificationsQueryValidator,
  idParamValidator,
} from './notifications.validation.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

/**
 * @route   GET /api/notifications
 * @desc    Get paginated notifications for the logged-in user
 * @access  Private
 */
router.get(
  '/',
  authenticateToken,
  listNotificationsQueryValidator,
  validateRequest,
  notificationsController.list
);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get the count of unread notifications for the logged-in user
 * @access  Private
 * Note: Must be defined before /:id to prevent route shadowing
 */
router.get(
  '/unread-count',
  authenticateToken,
  notificationsController.getUnreadCount
);

/**
 * @route   PUT /api/notifications/read-all (or PATCH)
 * @desc    Mark all unread notifications as read for the logged-in user
 * @access  Private
 * Note: Must be defined before /:id to prevent route shadowing
 */
router.put(
  '/read-all',
  authenticateToken,
  notificationsController.markAll
);
router.patch(
  '/read-all',
  authenticateToken,
  notificationsController.markAll
);

/**
 * @route   PUT /api/notifications/:id/read (or PATCH)
 * @desc    Mark a single notification as read
 * @access  Private
 */
router.put(
  '/:id/read',
  authenticateToken,
  idParamValidator('id'),
  validateRequest,
  notificationsController.markOne
);
router.patch(
  '/:id/read',
  authenticateToken,
  idParamValidator('id'),
  validateRequest,
  notificationsController.markOne
);

export default router;
