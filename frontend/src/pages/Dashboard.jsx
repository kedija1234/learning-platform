import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      {/* Header Band */}
      <div className="dashboard-hero">
        <div className="hero-text">
          <h1>{user?.first_name} {user?.last_name}</h1>
          <p className="hero-subtitle">
            {user?.role === 'student' && 'Student workspace for coursework, assignment submissions, and corporate internships.'}
            {user?.role === 'mentor' && 'Instructor workspace for course curriculum, assignments, and coursework grading.'}
            {user?.role === 'coordinator' && 'Coordinator workspace for partner internships, listings, and candidate applications.'}
            {user?.role === 'admin' && 'Administrator workspace for user accounts, platform permissions, and program analytics.'}
          </p>
        </div>
        <div className="hero-role-badge">
          <span className={`role-tag role-${user?.role}`}>{user?.role}</span>
        </div>
      </div>

      {/* Role-Specific Dashboard Content */}
      {user?.role === 'student' && (
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h2>Student Actions</h2>
            <p>Access your coursework, track progress, and apply for career opportunities.</p>
          </div>
          <div className="action-cards-grid">
            <div className="action-card">
              <h3>Course Catalog</h3>
              <p>Browse available university courses, view lecture resources, and enroll.</p>
              <Link to="/courses" className="btn btn-outline btn-sm">Explore Courses</Link>
            </div>

            <div className="action-card">
              <h3>Internship Opportunities</h3>
              <p>Search corporate positions, view qualification requirements, and apply.</p>
              <Link to="/internships" className="btn btn-outline btn-sm">Browse Internships</Link>
            </div>

            <div className="action-card">
              <h3>My Applications</h3>
              <p>Track the review status and coordinator decisions on your submitted applications.</p>
              <Link to="/applications" className="btn btn-outline btn-sm">View Status</Link>
            </div>

            <div className="action-card">
              <h3>Grades & Progress</h3>
              <p>Check assignment submissions, instructor scores, and academic feedback.</p>
              <Link to="/submissions" className="btn btn-outline btn-sm">My Grades</Link>
            </div>
          </div>

          <div className="dashboard-notice-card">
            <strong>Academic note:</strong> Enrolled courses display your submission progress. Review course details to view pending deadlines.
          </div>
        </div>
      )}

      {user?.role === 'mentor' && (
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h2>Instructor Actions</h2>
            <p>Publish curriculum, manage learning resources, and grade student submissions.</p>
          </div>
          <div className="action-cards-grid">
            <div className="action-card">
              <h3>Create Course</h3>
              <p>Publish a new course curriculum with syllabus information and assignment due dates.</p>
              <Link to="/courses/new" className="btn btn-primary btn-sm">Create Course</Link>
            </div>

            <div className="action-card">
              <h3>Manage Courses</h3>
              <p>View courses you teach, enrolled student rosters, and attached reference materials.</p>
              <Link to="/courses" className="btn btn-outline btn-sm">View Courses</Link>
            </div>

            <div className="action-card">
              <h3>Grade Submissions</h3>
              <p>Review student coursework solutions, assign scores, and leave constructive feedback.</p>
              <Link to="/courses" className="btn btn-outline btn-sm">Open Course List</Link>
            </div>
          </div>

          <div className="dashboard-notice-card">
            <strong>Instructor note:</strong> Open individual course details to grade coursework submissions or attach new learning links.
          </div>
        </div>
      )}

      {user?.role === 'coordinator' && (
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h2>Coordinator Actions</h2>
            <p>Manage corporate partner relationships, post openings, and assess applicants.</p>
          </div>
          <div className="action-cards-grid">
            <div className="action-card">
              <h3>Post Internship</h3>
              <p>Publish a new internship position with requirements and an application deadline.</p>
              <Link to="/internships/new" className="btn btn-primary btn-sm">Post Opportunity</Link>
            </div>

            <div className="action-card">
              <h3>Internship Listings</h3>
              <p>Inspect active postings, monitor application volume, and manage deadlines.</p>
              <Link to="/internships" className="btn btn-outline btn-sm">View Listings</Link>
            </div>

            <div className="action-card">
              <h3>Review Candidates</h3>
              <p>Assess candidate credentials, mark applications as accepted, or send notifications.</p>
              <Link to="/internships" className="btn btn-outline btn-sm">Review Candidates</Link>
            </div>
          </div>

          <div className="dashboard-notice-card">
            <strong>Placement note:</strong> When you accept or reject an application, the candidate receives an automated notification.
          </div>
        </div>
      )}

      {user?.role === 'admin' && (
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h2>Administration Actions</h2>
            <p>Manage user accounts, monitor system metrics, and oversee platform activity.</p>
          </div>
          <div className="action-cards-grid">
            <div className="action-card">
              <h3>User Accounts & Roles</h3>
              <p>Inspect registered users, assign role permissions, and toggle active account status.</p>
              <Link to="/admin/users" className="btn btn-outline btn-sm">Manage Users</Link>
            </div>

            <div className="action-card">
              <h3>Platform Analytics</h3>
              <p>View real-time metric counts across users, courses, coursework, and internships.</p>
              <Link to="/admin/stats" className="btn btn-outline btn-sm">View Statistics</Link>
            </div>

            <div className="action-card">
              <h3>Course Catalog</h3>
              <p>Oversee all published courses, learning materials, and coursework platform-wide.</p>
              <Link to="/courses" className="btn btn-outline btn-sm">Manage Courses</Link>
            </div>

            <div className="action-card">
              <h3>Career Postings</h3>
              <p>Review corporate partner positions and student application history platform-wide.</p>
              <Link to="/internships" className="btn btn-outline btn-sm">Manage Internships</Link>
            </div>
          </div>

          <div className="dashboard-notice-card">
            <strong>Administration note:</strong> Role changes and account toggles take effect immediately on next token renewal.
          </div>
        </div>
      )}
    </div>
  );
}
