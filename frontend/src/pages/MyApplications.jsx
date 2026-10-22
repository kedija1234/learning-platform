import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import Pagination from '../components/Pagination';

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchApplications = async (targetPage = 1) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get(`/internships/applications/me?page=${targetPage}&limit=10`);
      setApplications(data.data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load your applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications(page);
  }, [page]);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>My Internship Applications</h1>
          <p className="page-subtitle">Track the review status and coordinator decisions on your submitted applications</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
          <button className="btn btn-sm btn-outline" style={{ marginTop: '0.5rem' }} onClick={() => fetchApplications(page)}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading application history...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📂</span>
          <h3>No applications submitted</h3>
          <p>You haven't applied for any internships yet. Browse available postings and submit applications.</p>
          <Link to="/internships" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            Explore Internships
          </Link>
        </div>
      ) : (
        <>
          <div className="applications-list">
            {applications.map((app) => (
              <div key={app.id} className="application-item-card">
                <div className="app-main-info">
                  <span className="company-badge">🏢 {app.organization_name}</span>
                  <h3 className="app-job-title">{app.internship_title}</h3>
                  <p className="app-coordinator">
                    Coordinator: {app.coordinator_first_name} {app.coordinator_last_name}
                  </p>
                  <p className="app-date">
                    Applied on: {new Date(app.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="app-status-box">
                  <span className={`status-pill status-${app.status}`}>
                    {app.status === 'accepted'
                      ? '✓ Accepted'
                      : app.status === 'rejected'
                      ? '✕ Rejected'
                      : '⏳ Pending Review'}
                  </span>
                  <Link to={`/internships/${app.internship_id}`} className="btn btn-sm btn-outline" style={{ marginTop: '0.5rem' }}>
                    View Posting →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <Pagination pagination={pagination} onPageChange={(newPage) => setPage(newPage)} />
        </>
      )}
    </div>
  );
}
