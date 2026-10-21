import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <div className="dashboard-hero">
        <div className="hero-text">
          <h1>Welcome back, {user?.first_name}! 👋</h1>
          <p className="hero-subtitle">
            You are logged in as a <span className={`role-tag role-${user?.role}`}>{user?.role}</span> on the University Learning & Internship Platform.
          </p>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Quick Actions</h2>
        <div className="action-cards-grid">
          {user?.role === 'student' && (
            <>
              <div className="action-card">
                <div className="action-card-icon">📚</div>
                <h3>Course Catalog</h3>
                <p>Browse available university courses, view resources, and enroll.</p>
                <Link to="/courses" className="btn btn-primary btn-sm">Explore Courses</Link>
              </div>

              <div className="action-card">
                <div className="action-card-icon">💼</div>
                <h3>Internship Opportunities</h3>
                <p>Search corporate internships, apply, and jumpstart your career.</p>
                <Link to="/internships" className="btn btn-primary btn-sm">Browse Internships</Link>
              </div>

              <div className="action-card">
                <div className="action-card-icon">📋</div>
                <h3>My Applications</h3>
                <p>Track the status of your submitted internship applications.</p>
                <Link to="/applications" className="btn btn-outline btn-sm">View Status</Link>
              </div>

              <div className="action-card">
                <div className="action-card-icon">📊</div>
                <h3>Grades & Progress</h3>
                <p>Check your assignment submissions, mentor feedback, and course progress.</p>
                <Link to="/submissions" className="btn btn-outline btn-sm">My Grades</Link>
              </div>
            </>
          )}

          {user?.role === 'mentor' && (
            <>
              <div className="action-card">
                <div className="action-card-icon">📖</div>
                <h3>Manage Courses</h3>
                <p>View the courses you teach, enrolled students, and learning resources.</p>
                <Link to="/courses" className="btn btn-primary btn-sm">View Courses</Link>
              </div>

              <div className="action-card">
                <div className="action-card-icon">➕</div>
                <h3>Create Course</h3>
                <p>Publish a new course curriculum with assignments and due dates.</p>
                <Link to="/courses/new" className="btn btn-primary btn-sm">Create Course</Link>
              </div>

              <div className="action-card">
                <div className="action-card-icon">📝</div>
                <h3>Grade Submissions</h3>
                <p>Review student coursework submissions, assign grades, and provide feedback.</p>
                <Link to="/courses" className="btn btn-outline btn-sm">Open Course List</Link>
              </div>
            </>
          )}

          {user?.role === 'coordinator' && (
            <>
              <div className="action-card">
                <div className="action-card-icon">🏢</div>
                <h3>Internship Listings</h3>
                <p>Manage corporate partner internship postings and deadlines.</p>
                <Link to="/internships" className="btn btn-primary btn-sm">View Listings</Link>
              </div>

              <div className="action-card">
                <div className="action-card-icon">📢</div>
                <h3>Post Internship</h3>
                <p>Publish a new internship position with requirements and application deadline.</p>
                <Link to="/internships/new" className="btn btn-primary btn-sm">Post Opportunity</Link>
              </div>

              <div className="action-card">
                <div className="action-card-icon">👥</div>
                <h3>Review Applications</h3>
                <p>Assess candidate applications, accept qualified students, or send rejections.</p>
                <Link to="/internships" className="btn btn-outline btn-sm">Review Candidates</Link>
              </div>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <div className="action-card">
                <div className="action-card-icon">🛡️</div>
                <h3>Platform Management</h3>
                <p>Oversee courses, mentorship assignments, and internship opportunities across all faculties.</p>
                <Link to="/courses" className="btn btn-primary btn-sm">Manage Courses</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
