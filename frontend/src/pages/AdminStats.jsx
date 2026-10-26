import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

export default function AdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get('/admin/stats');
      setStats(data.data?.stats || null);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load platform statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Gathering platform metrics and analytics...</p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="page-wrapper">
        <div className="alert alert-error" style={{ margin: '2rem 0' }}>
          <p>{error}</p>
          <button className="btn btn-sm btn-outline" style={{ marginTop: '0.75rem' }} onClick={fetchStats}>
            Retry Loading Analytics
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { users, courses, enrollments, submissions, internships, applications } = stats;

  const gradingRate = submissions.total > 0
    ? Math.round((submissions.graded / submissions.total) * 100)
    : 0;

  const acceptanceRate = applications.total > 0
    ? Math.round((applications.accepted / applications.total) * 100)
    : 0;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>Platform Statistics & Analytics</h1>
          <p className="page-subtitle">Real-time counts and metrics across user roles, curriculum, coursework, and internship programs</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchStats}>
          🔄 Refresh Metrics
        </button>
      </div>

      {/* Top Level Metric Summary Cards */}
      <div className="stats-metric-grid">
        <div className="metric-card metric-primary">
          <div className="metric-icon">👥</div>
          <div className="metric-body">
            <span className="metric-label">Total Users</span>
            <span className="metric-value">{users.total}</span>
            <span className="metric-sub">{users.active} active accounts</span>
          </div>
        </div>

        <div className="metric-card metric-success">
          <div className="metric-icon">📚</div>
          <div className="metric-body">
            <span className="metric-label">Active Courses</span>
            <span className="metric-value">{courses.total}</span>
            <span className="metric-sub">{enrollments.total} total enrollments</span>
          </div>
        </div>

        <div className="metric-card metric-warning">
          <div className="metric-icon">📝</div>
          <div className="metric-body">
            <span className="metric-label">Coursework Submissions</span>
            <span className="metric-value">{submissions.total}</span>
            <span className="metric-sub">{submissions.graded} graded ({gradingRate}%)</span>
          </div>
        </div>

        <div className="metric-card metric-info">
          <div className="metric-icon">💼</div>
          <div className="metric-body">
            <span className="metric-label">Internship Postings</span>
            <span className="metric-value">{internships.total}</span>
            <span className="metric-sub">{applications.total} student applications</span>
          </div>
        </div>
      </div>

      {/* Detailed Categorical Breakdown Grids */}
      <div className="stats-details-grid">
        {/* User Distribution Card */}
        <div className="stat-detail-card">
          <div className="stat-card-header">
            <h3>User Demographics by Role</h3>
            <span className="count-pill">{users.total} registered</span>
          </div>
          <div className="stat-card-body">
            <div className="breakdown-list">
              <div className="breakdown-item">
                <div className="breakdown-label">
                  <span className="role-tag role-student">Students</span>
                  <span className="breakdown-count">{users.students}</span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${users.total > 0 ? (users.students / users.total) * 100 : 0}%`, backgroundColor: '#3b82f6' }}
                  ></div>
                </div>
              </div>

              <div className="breakdown-item">
                <div className="breakdown-label">
                  <span className="role-tag role-mentor">Faculty Mentors</span>
                  <span className="breakdown-count">{users.mentors}</span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${users.total > 0 ? (users.mentors / users.total) * 100 : 0}%`, backgroundColor: '#f59e0b' }}
                  ></div>
                </div>
              </div>

              <div className="breakdown-item">
                <div className="breakdown-label">
                  <span className="role-tag role-coordinator">Coordinators</span>
                  <span className="breakdown-count">{users.coordinators}</span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${users.total > 0 ? (users.coordinators / users.total) * 100 : 0}%`, backgroundColor: '#8b5cf6' }}
                  ></div>
                </div>
              </div>

              <div className="breakdown-item">
                <div className="breakdown-label">
                  <span className="role-tag role-admin">Administrators</span>
                  <span className="breakdown-count">{users.admins}</span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${users.total > 0 ? (users.admins / users.total) * 100 : 0}%`, backgroundColor: '#ef4444' }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="status-ratio-box">
              <div className="ratio-col">
                <span className="ratio-title">Active Accounts</span>
                <span className="ratio-val text-success">{users.active}</span>
              </div>
              <div className="ratio-col">
                <span className="ratio-title">Deactivated</span>
                <span className="ratio-val text-danger">{users.inactive}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Academics & Coursework Card */}
        <div className="stat-detail-card">
          <div className="stat-card-header">
            <h3>Academic Coursework & Progress</h3>
            <span className="count-pill">{courses.total} Courses</span>
          </div>
          <div className="stat-card-body">
            <div className="metrics-key-value-list">
              <div className="kv-row">
                <span>Total Courses Published</span>
                <strong>{courses.total}</strong>
              </div>
              <div className="kv-row">
                <span>Total Course Enrollments</span>
                <strong>{enrollments.total}</strong>
              </div>
              <div className="kv-row">
                <span>Average Enrollments / Course</span>
                <strong>
                  {courses.total > 0 ? (enrollments.total / courses.total).toFixed(1) : 0}
                </strong>
              </div>
              <div className="kv-row">
                <span>Total Student Submissions</span>
                <strong>{submissions.total}</strong>
              </div>
              <div className="kv-row">
                <span>Graded Coursework Items</span>
                <strong>{submissions.graded}</strong>
              </div>
              <div className="kv-row">
                <span>Grading Completion Rate</span>
                <strong>{gradingRate}%</strong>
              </div>
            </div>

            <div className="progress-section" style={{ marginTop: '1.25rem' }}>
              <div className="progress-labels">
                <span>Submissions Graded</span>
                <strong>{gradingRate}%</strong>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${gradingRate}%`, backgroundColor: '#10b981' }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Internships & Career Applications Card */}
        <div className="stat-detail-card">
          <div className="stat-card-header">
            <h3>Career & Internship Applications</h3>
            <span className="count-pill">{internships.total} Postings</span>
          </div>
          <div className="stat-card-body">
            <div className="metrics-key-value-list">
              <div className="kv-row">
                <span>Corporate Positions Listed</span>
                <strong>{internships.total}</strong>
              </div>
              <div className="kv-row">
                <span>Student Applications Submitted</span>
                <strong>{applications.total}</strong>
              </div>
              <div className="kv-row">
                <span>Pending Review</span>
                <span className="status-pill status-pending">{applications.pending}</span>
              </div>
              <div className="kv-row">
                <span>Applications Accepted</span>
                <span className="status-pill status-accepted">{applications.accepted}</span>
              </div>
              <div className="kv-row">
                <span>Applications Rejected</span>
                <span className="status-pill status-rejected">{applications.rejected}</span>
              </div>
              <div className="kv-row">
                <span>Acceptance Rate</span>
                <strong>{acceptanceRate}%</strong>
              </div>
            </div>

            <div className="progress-section" style={{ marginTop: '1.25rem' }}>
              <div className="progress-labels">
                <span>Application Acceptance Rate</span>
                <strong>{acceptanceRate}%</strong>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${acceptanceRate}%`, backgroundColor: '#10b981' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
