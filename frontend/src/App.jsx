import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes enclosed within shared Navigation Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />

            {/* Placeholders for upcoming steps (to be expanded in Steps 2-4) */}
            <Route path="/courses" element={<div className="content-box"><h2>Courses</h2><p>Course screen will load here in Step 2.</p></div>} />
            <Route
              path="/courses/new"
              element={
                <ProtectedRoute allowedRoles={['mentor', 'admin']}>
                  <div className="content-box"><h2>Create Course</h2><p>Mentor course creation will load here in Step 3.</p></div>
                </ProtectedRoute>
              }
            />
            <Route path="/courses/:id" element={<div className="content-box"><h2>Course Details</h2></div>} />

            <Route path="/internships" element={<div className="content-box"><h2>Internships</h2><p>Internships list will load here in Step 2.</p></div>} />
            <Route
              path="/internships/new"
              element={
                <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                  <div className="content-box"><h2>Post Internship</h2><p>Coordinator posting will load here in Step 4.</p></div>
                </ProtectedRoute>
              }
            />
            <Route path="/internships/:id" element={<div className="content-box"><h2>Internship Details</h2></div>} />

            <Route
              path="/applications"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <div className="content-box"><h2>My Applications</h2></div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/submissions"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <div className="content-box"><h2>My Grades & Submissions</h2></div>
                </ProtectedRoute>
              }
            />

            <Route path="/notifications" element={<div className="content-box"><h2>Notifications</h2><p>Notifications list will load here in Step 2.</p></div>} />
          </Route>

          {/* Fallback 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
