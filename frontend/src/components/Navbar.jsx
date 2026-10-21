import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Poll or fetch unread notification count
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    async function fetchUnread() {
      try {
        const { data } = await apiClient.get('/notifications/unread-count');
        if (isMounted) {
          setUnreadCount(data?.data?.unread_count || 0);
        }
      } catch (err) {
        // Silent catch for background notification poll
      }
    }

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => (location.pathname === path ? 'active-link' : '');

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🎓</span>
          <span className="brand-title">UniPlatform</span>
        </Link>

        {isAuthenticated && (
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        )}

        {isAuthenticated && (
          <div className={`navbar-links ${mobileMenuOpen ? 'open' : ''}`}>
            {/* Common link */}
            <Link to="/" className={`nav-link ${isActive('/')}`} onClick={() => setMobileMenuOpen(false)}>
              Dashboard
            </Link>

            {/* Student Links */}
            {user?.role === 'student' && (
              <>
                <Link to="/courses" className={`nav-link ${isActive('/courses')}`} onClick={() => setMobileMenuOpen(false)}>
                  Courses
                </Link>
                <Link to="/internships" className={`nav-link ${isActive('/internships')}`} onClick={() => setMobileMenuOpen(false)}>
                  Internships
                </Link>
                <Link to="/applications" className={`nav-link ${isActive('/applications')}`} onClick={() => setMobileMenuOpen(false)}>
                  Applications
                </Link>
                <Link to="/submissions" className={`nav-link ${isActive('/submissions')}`} onClick={() => setMobileMenuOpen(false)}>
                  Grades
                </Link>
              </>
            )}

            {/* Mentor Links */}
            {user?.role === 'mentor' && (
              <>
                <Link to="/courses" className={`nav-link ${isActive('/courses')}`} onClick={() => setMobileMenuOpen(false)}>
                  Courses
                </Link>
                <Link to="/courses/new" className={`nav-link ${isActive('/courses/new')}`} onClick={() => setMobileMenuOpen(false)}>
                  + New Course
                </Link>
              </>
            )}

            {/* Coordinator Links */}
            {user?.role === 'coordinator' && (
              <>
                <Link to="/internships" className={`nav-link ${isActive('/internships')}`} onClick={() => setMobileMenuOpen(false)}>
                  Internships
                </Link>
                <Link to="/internships/new" className={`nav-link ${isActive('/internships/new')}`} onClick={() => setMobileMenuOpen(false)}>
                  + Post Internship
                </Link>
              </>
            )}

            {/* Right side: Notification badge & user menu */}
            <div className="navbar-actions">
              <Link
                to="/notifications"
                className={`notification-bell ${isActive('/notifications')}`}
                title="Notifications"
                onClick={() => setMobileMenuOpen(false)}
              >
                🔔
                {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </Link>

              <div className="user-profile-badge">
                <span className="user-name">
                  {user?.first_name} {user?.last_name}
                </span>
                <span className={`role-tag role-${user?.role}`}>{user?.role}</span>
              </div>

              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
