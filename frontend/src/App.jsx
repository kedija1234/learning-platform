import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CoursesList from './pages/CoursesList';
import CourseDetail from './pages/CourseDetail';
import CourseCreate from './pages/CourseCreate';
import InternshipsList from './pages/InternshipsList';
import InternshipDetail from './pages/InternshipDetail';
import MyApplications from './pages/MyApplications';
import MySubmissions from './pages/MySubmissions';
import Notifications from './pages/Notifications';
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

            {/* Courses Screens */}
            <Route path="/courses" element={<CoursesList />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route
              path="/courses/new"
              element={
                <ProtectedRoute allowedRoles={['mentor', 'admin']}>
                  <CourseCreate />
                </ProtectedRoute>
              }
            />

            {/* Internships Screens */}
            <Route path="/internships" element={<InternshipsList />} />
            <Route path="/internships/:id" element={<InternshipDetail />} />
            <Route
              path="/internships/new"
              element={
                <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                  <div className="content-box"><h2>Post Internship</h2><p>Coordinator posting will load here in Step 4.</p></div>
                </ProtectedRoute>
              }
            />

            {/* Student Specific Portals */}
            <Route
              path="/applications"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MyApplications />
                </ProtectedRoute>
              }
            />

            <Route
              path="/submissions"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MySubmissions />
                </ProtectedRoute>
              }
            />

            {/* Notifications Screen */}
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          {/* Fallback 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
