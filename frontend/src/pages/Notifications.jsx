import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import Pagination from '../components/Pagination';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const navigate = useNavigate();

  const fetchNotifications = async (targetPage = 1, filterUnread = false) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: targetPage, limit: 12 });
      if (filterUnread) {
        params.append('unreadOnly', 'true');
      }
      const { data } = await apiClient.get(`/notifications?${params.toString()}`);
      setNotifications(data.data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(page, unreadOnly);
  }, [page, unreadOnly]);

  const handleMarkOne = async (notification) => {
    if (!notification.is_read) {
      try {
        await apiClient.put(`/notifications/${notification.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: 1 } : n))
        );
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }

    if (notification.link_path) {
      navigate(notification.link_path);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    setError('');
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="page-wrapper">
      <div className="page-header notif-header-flex">
        <div>
          <h1>Notifications</h1>
          <p className="page-subtitle">Stay informed about grades, feedback, applications, and announcements</p>
        </div>

        <div className="header-actions">
          <div className="filter-button-group">
            <button
              className={`btn btn-sm ${!unreadOnly ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                setUnreadOnly(false);
                setPage(1);
              }}
            >
              All
            </button>
            <button
              className={`btn btn-sm ${unreadOnly ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                setUnreadOnly(true);
                setPage(1);
              }}
            >
              Unread Only
            </button>
          </div>

          <button
            className="btn btn-sm btn-outline"
            onClick={handleMarkAllRead}
            disabled={markingAll || !hasUnread}
          >
            {markingAll ? 'Updating...' : '✓ Mark All as Read'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🔔</span>
          <h3>No notifications</h3>
          <p>{unreadOnly ? 'You have no unread notifications.' : 'You do not have any notifications at this time.'}</p>
        </div>
      ) : (
        <>
          <div className="notifications-list">
            {notifications.map((notif) => {
              const isUnread = !notif.is_read;
              return (
                <div
                  key={notif.id}
                  className={`notification-item ${isUnread ? 'unread' : 'read'}`}
                  onClick={() => handleMarkOne(notif)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="notif-indicator">
                    {isUnread && <span className="unread-dot" title="Unread"></span>}
                  </div>

                  <div className="notif-content-area">
                    <p className="notif-message-text">{notif.message}</p>
                    <span className="notif-time">
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>

                  {notif.link_path && (
                    <div className="notif-link-arrow">
                      <span>View →</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Pagination pagination={pagination} onPageChange={(newPage) => setPage(newPage)} />
        </>
      )}
    </div>
  );
}
