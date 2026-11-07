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
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-title">UniLink</span>
        </Link>

        {isAuthenticated && (
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        )}

        {isAuthenticated && (
          <div className={`navbar-links ${mobileMenuOpen ? "open" : ""}`}>
            <Link
              to="/"
              className={`nav-link ${isActive("/")}`}
              onClick={closeMenu}
            >
              Home
            </Link>

            {user?.role === "student" && (
              <>
                <Link
                  to="/courses"
                  className={`nav-link ${isActive("/courses")}`}
                  onClick={closeMenu}
                >
                  Courses
                </Link>
                <Link
                  to="/internships"
                  className={`nav-link ${isActive("/internships")}`}
                  onClick={closeMenu}
                >
                  Internships
                </Link>
                <Link
                  to="/applications"
                  className={`nav-link ${isActive("/applications")}`}
                  onClick={closeMenu}
                >
                  My applications
                </Link>
                <Link
                  to="/submissions"
                  className={`nav-link ${isActive("/submissions")}`}
                  onClick={closeMenu}
                >
                  My grades
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
                  Courses
                </Link>
                <Link
                  to="/courses/new"
                  className={`nav-link ${isActive("/courses/new")}`}
                  onClick={closeMenu}
                >
                  New course
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
                  Internships
                </Link>
                <Link
                  to="/internships/new"
                  className={`nav-link ${isActive("/internships/new")}`}
                  onClick={closeMenu}
                >
                  Post internship
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
                  Users
                </Link>
                <Link
                  to="/admin/stats"
                  className={`nav-link ${isActive("/admin/stats")}`}
                  onClick={closeMenu}
                >
                  Statistics
                </Link>
                <Link
                  to="/courses"
                  className={`nav-link ${isActive("/courses")}`}
                  onClick={closeMenu}
                >
                  Courses
                </Link>
                <Link
                  to="/internships"
                  className={`nav-link ${isActive("/internships")}`}
                  onClick={closeMenu}
                >
                  Internships
                </Link>
              </>
            )}

            <div className="navbar-actions">
              <Link
                to="/notifications"
                className={`notification-bell ${isActive("/notifications")}`}
                title="Notifications"
                onClick={closeMenu}
              >
                Alerts
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              <div className="user-profile-badge">
                <span className="user-name">
                  {user?.first_name} {user?.last_name}
                </span>
                <span className={`role-tag role-${user?.role}`}>
                  {user?.role}
                </span>
              </div>

              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
