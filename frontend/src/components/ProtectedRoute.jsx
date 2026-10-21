import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="unauthorized-card">
        <h2>403 — Access Denied</h2>
        <p>
          Your account role (<strong>{user.role}</strong>) does not have permission to access this page.
        </p>
        <p>Required role: {allowedRoles.join(' or ')}</p>
        <a href="/" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
          Back to Dashboard
        </a>
      </div>
    );
  }

  return children;
}
