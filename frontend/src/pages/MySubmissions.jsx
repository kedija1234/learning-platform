import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import Pagination from '../components/Pagination';

export default function MySubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSubmissions = async (targetPage = 1) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get(`/submissions/me?page=${targetPage}&limit=10`);
      setSubmissions(data.data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load submissions and grades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(page);
  }, [page]);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>My Grades & Submissions</h1>
          <p className="page-subtitle">Track your coursework progress, awarded scores, and instructor feedback</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
          <button className="btn btn-sm btn-outline" style={{ marginTop: '0.5rem' }} onClick={() => fetchSubmissions(page)}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading your academic records...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📝</span>
          <h3>No submissions yet</h3>
          <p>You haven't submitted any coursework yet. Enroll in courses and submit assignments to see your grades here.</p>
          <Link to="/courses" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            Browse Courses
          </Link>
        </div>
      ) : (
        <>
          <div className="submissions-list">
            {submissions.map((sub) => {
              const isGraded = sub.grade !== null && sub.grade !== undefined;
              return (
                <div key={sub.id} className="submission-card">
                  <div className="submission-card-top">
                    <div>
                      <span className="course-ref-pill">{sub.course_title}</span>
                      <h3 className="sub-assignment-title">{sub.assignment_title}</h3>
                      <p className="sub-date">
                        Submitted on: {new Date(sub.submitted_at).toLocaleDateString()} at{' '}
                        {new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="sub-grade-badge-box">
                      {isGraded ? (
                        <div className="score-badge">
                          <span className="score-num">{Number(sub.grade)}</span>
                          <span className="score-max">/ 100</span>
                        </div>
                      ) : (
                        <span className="pending-grade-pill">⏳ Pending Grade</span>
                      )}
                    </div>
                  </div>

                  {sub.feedback && (
                    <div className="sub-feedback-box">
                      <strong>Instructor Feedback:</strong>
                      <p>"{sub.feedback}"</p>
                    </div>
                  )}

                  <div className="sub-card-footer">
                    <Link to={`/courses/${sub.course_id}`} className="btn btn-sm btn-outline">
                      Go to Course →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination pagination={pagination} onPageChange={(newPage) => setPage(newPage)} />
        </>
      )}
    </div>
  );
}
