import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';

export default function InternshipDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Coordinator state
  const [applications, setApplications] = useState([]);
  const [appPagination, setAppPagination] = useState(null);
  const [appPage, setAppPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [appsLoading, setAppsLoading] = useState(false);
  const [updatingAppId, setUpdatingAppId] = useState(null);
  const [coordinatorActionSuccess, setCoordinatorActionSuccess] = useState('');
  const [coordinatorActionError, setCoordinatorActionError] = useState('');
  const [deletingInternship, setDeletingInternship] = useState(false);

  const fetchInternship = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get(`/internships/${id}`);
      setInternship(data.data?.internship || null);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load internship details');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async (targetPage = 1, filter = statusFilter) => {
    setAppsLoading(true);
    setCoordinatorActionError('');
    try {
      const params = new URLSearchParams({ page: targetPage, limit: 10 });
      if (filter) {
        params.append('status', filter);
      }
      const { data } = await apiClient.get(`/internships/${id}/applications?${params.toString()}`);
      setApplications(data.data || []);
      setAppPagination(data.pagination || null);
    } catch (err) {
      setCoordinatorActionError(err.friendlyMessage || 'Failed to load applicant list');
    } finally {
      setAppsLoading(false);
    }
  };

  useEffect(() => {
    fetchInternship();
  }, [id]);

  const isOwnerCoordinator =
    (user?.role === 'coordinator' && String(user?.id) === String(internship?.coordinator_id)) ||
    user?.role === 'admin';

  useEffect(() => {
    if (internship && isOwnerCoordinator) {
      fetchApplications(appPage, statusFilter);
    }
  }, [internship?.id, isOwnerCoordinator, appPage, statusFilter]);

  const handleApply = async () => {
    setApplying(true);
    setError('');
    setSuccessMsg('');
    try {
      await apiClient.post(`/internships/${id}/apply`);
      setSuccessMsg('🎉 Your application was submitted successfully!');
      fetchInternship();
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const handleUpdateStatus = async (applicationId, newStatus) => {
    setUpdatingAppId(applicationId);
    setCoordinatorActionError('');
    setCoordinatorActionSuccess('');
    try {
      await apiClient.put(`/internships/${id}/applications/${applicationId}/status`, {
        status: newStatus,
      });
      setCoordinatorActionSuccess(
        `Application marked as ${newStatus}. Candidate was notified automatically.`
      );
      fetchApplications(appPage, statusFilter);
      fetchInternship();
    } catch (err) {
      setCoordinatorActionError(err.friendlyMessage || 'Failed to update application status');
    } finally {
      setUpdatingAppId(null);
    }
  };

  const handleDeleteInternship = async () => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete "${internship.title}"? All submitted student applications will also be deleted.`
      )
    ) {
      return;
    }
    setDeletingInternship(true);
    setCoordinatorActionError('');
    try {
      await apiClient.delete(`/internships/${internship.id}`);
      navigate('/internships');
    } catch (err) {
      setCoordinatorActionError(err.friendlyMessage || 'Failed to delete internship');
      setDeletingInternship(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading position details...</p>
      </div>
    );
  }

  if (error && !internship) {
    return (
      <div className="alert alert-error" style={{ margin: '2rem 0' }}>
        <p>{error}</p>
        <Link to="/internships" className="btn btn-sm btn-outline" style={{ marginTop: '0.75rem', display: 'inline-block' }}>
          ← Back to Internships
        </Link>
      </div>
    );
  }

  if (!internship) return null;

  const isStudent = user?.role === 'student';
  const hasApplied = !!internship.my_application_status;
  const isPastDeadline = internship.deadline && new Date() > new Date(internship.deadline);

  return (
    <div className="page-wrapper">
      <Link to="/internships" className="back-link">
        ← Back to All Internships
      </Link>

      <div className="internship-detail-card">
        <div className="detail-header-row">
          <div>
            <span className="company-badge-lg">🏢 {internship.organization_name}</span>
            <h1 className="detail-job-title">{internship.title}</h1>
            <p className="detail-coordinator">
              Posted by Coordinator: <strong>{internship.coordinator_first_name} {internship.coordinator_last_name}</strong> ({internship.coordinator_email})
            </p>
          </div>

          <div className="deadline-box">
            <span className="deadline-title">Application Deadline</span>
            <p className={`deadline-val ${isPastDeadline ? 'deadline-expired' : ''}`}>
              {internship.deadline ? new Date(internship.deadline).toLocaleDateString() : 'Rolling Admission'}
            </p>
            {isPastDeadline && <span className="deadline-status-pill">Closed</span>}
            {isOwnerCoordinator && (
              <button
                type="button"
                className="btn btn-xs btn-outline-danger"
                style={{ marginTop: '0.75rem', width: '100%' }}
                onClick={handleDeleteInternship}
                disabled={deletingInternship}
              >
                {deletingInternship ? 'Deleting...' : '🗑 Delete Posting'}
              </button>
            )}
          </div>
        </div>

        {/* Application status banner if student */}
        {isStudent && (
          <div className="application-callout-box">
            {hasApplied ? (
              <div className="applied-info-banner">
                <div className="applied-banner-text">
                  <h3>Application Status:</h3>
                  <span className={`status-pill status-${internship.my_application_status}`}>
                    {internship.my_application_status === 'accepted'
                      ? '🎉 Accepted'
                      : internship.my_application_status === 'rejected'
                      ? '✕ Application Rejected'
                      : '⏳ Application Under Review (Pending)'}
                  </span>
                </div>
                <p className="applied-note">
                  {internship.my_application_status === 'accepted'
                    ? 'Congratulations! The university internship coordinator has approved your application.'
                    : internship.my_application_status === 'rejected'
                    ? 'Thank you for your interest. You may apply for other open opportunities.'
                    : 'Your application has been received and is being evaluated by the program coordinator.'}
                </p>
              </div>
            ) : isPastDeadline ? (
              <div className="alert alert-error">
                ⛔ Applications for this internship opportunity have closed because the deadline has passed.
              </div>
            ) : (
              <div className="apply-cta-banner">
                <div>
                  <h3>Ready to apply?</h3>
                  <p>Submit your student profile and credentials directly to the coordinator.</p>
                </div>
                {successMsg && <div className="alert alert-success">{successMsg}</div>}
                {error && <div className="alert alert-error">{error}</div>}
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="btn btn-primary"
                >
                  {applying ? 'Submitting Application...' : 'Submit Application Now →'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Job Description Section */}
        <div className="internship-description-section">
          <h2>About the Position & Role Description</h2>
          <div className="description-text-block">
            {internship.description || 'No detailed description provided.'}
          </div>
        </div>

        {/* Coordinator Applicant Review Section */}
        {isOwnerCoordinator && (
          <div className="applicant-review-section">
            <div className="applicant-review-header">
              <div>
                <h2>Applicant Review & Decisions</h2>
                <p className="section-subtitle">
                  Review student submissions and accept or reject candidates. Students receive instant notifications upon decision.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="filter-pill-group">
                <button
                  type="button"
                  className={`filter-pill-btn ${statusFilter === '' ? 'active' : ''}`}
                  onClick={() => {
                    setStatusFilter('');
                    setAppPage(1);
                  }}
                >
                  All ({internship.applicant_count || applications.length})
                </button>
                <button
                  type="button"
                  className={`filter-pill-btn ${statusFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => {
                    setStatusFilter('pending');
                    setAppPage(1);
                  }}
                >
                  Pending
                </button>
                <button
                  type="button"
                  className={`filter-pill-btn ${statusFilter === 'accepted' ? 'active' : ''}`}
                  onClick={() => {
                    setStatusFilter('accepted');
                    setAppPage(1);
                  }}
                >
                  Accepted
                </button>
                <button
                  type="button"
                  className={`filter-pill-btn ${statusFilter === 'rejected' ? 'active' : ''}`}
                  onClick={() => {
                    setStatusFilter('rejected');
                    setAppPage(1);
                  }}
                >
                  Rejected
                </button>
              </div>
            </div>

            {coordinatorActionSuccess && (
              <div className="alert alert-success">{coordinatorActionSuccess}</div>
            )}
            {coordinatorActionError && (
              <div className="alert alert-error">{coordinatorActionError}</div>
            )}

            {appsLoading ? (
              <div className="loading-screen" style={{ minHeight: '160px' }}>
                <div className="spinner"></div>
                <p>Loading applicants...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="empty-state" style={{ margin: '1rem 0' }}>
                <span className="empty-icon">👥</span>
                <h4>No applicants found</h4>
                <p>
                  {statusFilter
                    ? `No applications with "${statusFilter}" status.`
                    : 'No students have applied to this internship posting yet.'}
                </p>
              </div>
            ) : (
              <div className="applicants-list">
                {applications.map((app) => {
                  const isUpdating = updatingAppId === app.id;
                  return (
                    <div key={app.id} className="applicant-card">
                      <div className="applicant-details">
                        <div className="applicant-name-row">
                          <h4>
                            {app.first_name} {app.last_name}
                          </h4>
                          <span className={`status-pill status-${app.status}`}>
                            {app.status === 'accepted'
                              ? '✓ Accepted'
                              : app.status === 'rejected'
                              ? '✕ Rejected'
                              : '⏳ Pending'}
                          </span>
                        </div>
                        <p className="applicant-email">📧 {app.email}</p>
                        <p className="applicant-applied-time">
                          Applied on: {new Date(app.created_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="applicant-action-buttons">
                        {app.status !== 'accepted' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            onClick={() => handleUpdateStatus(app.id, 'accepted')}
                            disabled={isUpdating}
                          >
                            {isUpdating ? 'Updating...' : '✓ Accept'}
                          </button>
                        )}
                        {app.status !== 'rejected' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleUpdateStatus(app.id, 'rejected')}
                            disabled={isUpdating}
                          >
                            {isUpdating ? 'Updating...' : '✕ Reject'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                <Pagination
                  pagination={appPagination}
                  onPageChange={(newPage) => setAppPage(newPage)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
