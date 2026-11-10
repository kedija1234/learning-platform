import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch the unread notification count now, then every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    async function fetchUnread() {
      try {
        const { data } = await apiClient.get("/notifications/unread-count");
        if (isMounted) {
          setUnreadCount(data?.data?.unread_count || 0);
        }
      } catch (err) {
        // Ignore errors from the background poll
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
    navigate("/login");
  };

  const isActive = (path) => (location.pathname === path ? "active-link" : "");
  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <aside className="sidebar">
      {/* Mobile Top Bar */}
      <div className="mobile-header-bar">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="brand-title">UniLink</span>
        </Link>

        {isAuthenticated && (
          <div className="mobile-header-actions">
            <Link
              to="/notifications"
              className={`mobile-notif-btn ${isActive("/notifications")}`}
              title="Notifications"
              onClick={closeMenu}
            >
              <span>Alerts</span>
              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            <button
              className="mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main Sidebar Navigation Content */}
      <div className={`sidebar-inner ${mobileMenuOpen ? "open" : ""}`}>
        {/* Desktop Brand Header */}
        <div className="sidebar-brand-header">
          <Link to="/" className="navbar-brand" onClick={closeMenu}>
            <span className="brand-title">UniLink</span>
          </Link>
          <span className="brand-subtitle">University Platform</span>
        </div>

        {isAuthenticated && (
          <>
            <nav className="sidebar-nav" aria-label="Main Navigation">
              <span className="nav-section-title">Menu</span>

              <Link
                to="/"
                className={`nav-link ${isActive("/")}`}
                onClick={closeMenu}
              >
                <span>Home</span>
              </Link>

              {user?.role === "student" && (
                <>
                  <Link
                    to="/courses"
                    className={`nav-link ${isActive("/courses")}`}
                    onClick={closeMenu}
                  >
                    <span>Courses</span>
                  </Link>
                  <Link
                    to="/internships"
                    className={`nav-link ${isActive("/internships")}`}
                    onClick={closeMenu}
                  >
                    <span>Internships</span>
                  </Link>
                  <Link
                    to="/applications"
                    className={`nav-link ${isActive("/applications")}`}
                    onClick={closeMenu}
                  >
                    <span>My applications</span>
                  </Link>
                  <Link
                    to="/submissions"
                    className={`nav-link ${isActive("/submissions")}`}
                    onClick={closeMenu}
                  >
                    <span>My grades</span>
                  </Link>
                  <Link
                    to="/assistant"
                    className={`nav-link ${isActive("/assistant")}`}
                    onClick={closeMenu}
                  >
                    <span>Study Assistant</span>
                  </Link>
                </>
              )}

              {user?.role === "mentor" && (
                <>
                  <Link
                    to="/courses"
                    className={`nav-link ${isActive("/courses")}`}
                    onClick={closeMenu}
                  >
                    <span>Courses</span>
                  </Link>
                  <Link
                    to="/courses/new"
                    className={`nav-link ${isActive("/courses/new")}`}
                    onClick={closeMenu}
                  >
                    <span>New course</span>
                  </Link>
                  <Link
                    to="/assistant"
                    className={`nav-link ${isActive("/assistant")}`}
                    onClick={closeMenu}
                  >
                    <span>Study Assistant</span>
                  </Link>
                </>
              )}

              {user?.role === "coordinator" && (
                <>
                  <Link
                    to="/internships"
                    className={`nav-link ${isActive("/internships")}`}
                    onClick={closeMenu}
                  >
                    <span>Internships</span>
                  </Link>
                  <Link
                    to="/internships/new"
                    className={`nav-link ${isActive("/internships/new")}`}
                    onClick={closeMenu}
                  >
                    <span>Post internship</span>
                  </Link>
                </>
              )}

              {user?.role === "admin" && (
                <>
                  <Link
                    to="/admin/users"
                    className={`nav-link ${isActive("/admin/users")}`}
                    onClick={closeMenu}
                  >
                    <span>Users</span>
                  </Link>
                  <Link
                    to="/admin/stats"
                    className={`nav-link ${isActive("/admin/stats")}`}
                    onClick={closeMenu}
                  >
                    <span>Statistics</span>
                  </Link>
                  <Link
                    to="/courses"
                    className={`nav-link ${isActive("/courses")}`}
                    onClick={closeMenu}
                  >
                    <span>Courses</span>
                  </Link>
                  <Link
                    to="/internships"
                    className={`nav-link ${isActive("/internships")}`}
                    onClick={closeMenu}
                  >
                    <span>Internships</span>
                  </Link>
                </>
              )}

              <span
                className="nav-section-title"
                style={{ marginTop: "0.85rem" }}
              >
                Account
              </span>
              <Link
                to="/notifications"
                className={`nav-link ${isActive("/notifications")}`}
                onClick={closeMenu}
              >
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            </nav>

            <div className="sidebar-footer">
              <div className="user-profile-badge">
                <span className="user-name">
                  {user?.first_name} {user?.last_name}
                </span>
                <span className={`role-tag role-${user?.role}`}>
                  {user?.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="btn btn-outline btn-sm btn-block"
              >
                Log out
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="sidebar-backdrop"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </aside>
  );
}
