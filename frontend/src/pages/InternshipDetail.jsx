import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function InternshipDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  useEffect(() => {
    fetchInternship();
  }, [id]);

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

        {/* Job Description */}
        <div className="internship-description-section">
          <h2>About the Position & Role Description</h2>
          <div className="description-text-block">
            {internship.description || 'No detailed description provided.'}
          </div>
        </div>
      </div>
    </div>
  );
}
