import pool from '../../config/db.js';

/**
 * Lists notifications for the authenticated user with pagination and optional unread filter
 * Strict isolation: users can ONLY query their own notifications (user_id = ?)
 * TiDB Cloud compatible: safe integer interpolation for LIMIT/OFFSET
 */
export async function listNotifications(userId, { page = 1, limit = 10, unreadOnly = false }) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const safeOffset = (safePage - 1) * safeLimit;

  const whereClauses = ['user_id = ?'];
  const params = [userId];

  const shouldFilterUnread = unreadOnly === true || unreadOnly === 'true' || unreadOnly === '1';
  if (shouldFilterUnread) {
    whereClauses.push('is_read = FALSE');
  }

  const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;

  // Total count for pagination
  const [countResult] = await pool.query(
    `SELECT COUNT(*) AS total FROM notifications ${whereSQL}`,
    params
  );
  const total = countResult[0].total;

  // Paginated records
  const [notifications] = await pool.query(
    `SELECT id, user_id, type, message, link_path, is_read, created_at
     FROM notifications
     ${whereSQL}
     ORDER BY created_at DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  return {
    notifications,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

/**
 * Returns the count of unread notifications for the authenticated user
 */
export async function getUnreadCount(userId) {
  const [result] = await pool.query(
    'SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE',
    [userId]
  );

  return {
    unread_count: Number(result[0].unread_count) || 0,
  };
}

/**
 * Marks a single notification as read after verifying ownership
 */
export async function markAsRead(notificationId, userId) {
  // 1. Fetch notification to verify existence and ownership
  const [rows] = await pool.query(
    'SELECT id, user_id, type, message, link_path, is_read, created_at FROM notifications WHERE id = ?',
    [notificationId]
  );

  if (rows.length === 0) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }

  const notification = rows[0];

  // 2. Strict ownership check: users can only modify their own notifications
  if (notification.user_id !== userId) {
    const error = new Error('Forbidden: You can only update your own notifications');
    error.statusCode = 403;
    throw error;
  }

  // 3. Mark as read if not already read
  if (!notification.is_read) {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ?',
      [notificationId]
    );
    notification.is_read = 1;
  }

  return notification;
}

/**
 * Marks all unread notifications as read for the authenticated user
 */
export async function markAllAsRead(userId) {
  const [result] = await pool.query(
    'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
    [userId]
  );

  return {
    message: 'All notifications marked as read',
    updated_count: result.affectedRows,
  };
}

export default {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
