import * as notificationsService from './notifications.service.js';

/**
 * Controller to list notifications for the logged-in user
 * GET /api/notifications
 */
export async function list(req, res, next) {
  try {
    const { page, limit, unreadOnly } = req.query;
    const result = await notificationsService.listNotifications(
      req.user.id,
      { page, limit, unreadOnly }
    );

    res.status(200).json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to get unread notification count
 * GET /api/notifications/unread-count
 */
export async function getUnreadCount(req, res, next) {
  try {
    const result = await notificationsService.getUnreadCount(req.user.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to mark a single notification as read
 * PUT /api/notifications/:id/read
 */
export async function markOne(req, res, next) {
  try {
    const notification = await notificationsService.markAsRead(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to mark all notifications as read
 * PUT /api/notifications/read-all
 */
export async function markAll(req, res, next) {
  try {
    const result = await notificationsService.markAllAsRead(req.user.id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: { updated_count: result.updated_count },
    });
  } catch (error) {
    next(error);
  }
}

export default {
  list,
  getUnreadCount,
  markOne,
  markAll,
};
