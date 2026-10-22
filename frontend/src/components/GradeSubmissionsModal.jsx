import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import Pagination from './Pagination';

export default function GradeSubmissionsModal({ assignment, courseId, isOpen, onClose, onGraded }) {
  const [submissions, setSubmissions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Per-submission grading form states
  const [gradeInputs, setGradeInputs] = useState({});
  const [feedbackInputs, setFeedbackInputs] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [saveSuccessId, setSaveSuccessId] = useState(null);

  const fetchSubmissions = async (targetPage = 1) => {
    if (!assignment) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get(
        `/assignments/${assignment.id}/submissions?page=${targetPage}&limit=10`
      );
      const list = data.data || [];
      setSubmissions(list);
      setPagination(data.pagination || null);

      // Initialize grading input states from current values
      const initialGrades = {};
      const initialFeedbacks = {};
      list.forEach((sub) => {
        initialGrades[sub.id] = sub.grade !== null && sub.grade !== undefined ? Number(sub.grade) : '';
        initialFeedbacks[sub.id] = sub.feedback || '';
      });
      setGradeInputs(initialGrades);
      setFeedbackInputs(initialFeedbacks);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && assignment) {
      fetchSubmissions(page);
    }
  }, [isOpen, assignment, page]);

  if (!isOpen || !assignment) return null;

  const handleGradeSubmit = async (submissionId) => {
    const gradeVal = gradeInputs[submissionId];
    const feedbackVal = feedbackInputs[submissionId] || '';

    if (gradeVal === '' || isNaN(gradeVal) || gradeVal < 0 || gradeVal > 100) {
      alert('Please provide a valid grade between 0 and 100.');
      return;
    }

    setSavingId(submissionId);
    setSaveSuccessId(null);
    try {
      await apiClient.put(`/submissions/${submissionId}/grade`, {
        grade: Number(gradeVal),
        feedback: feedbackVal.trim(),
      });
      setSaveSuccessId(submissionId);
      if (onGraded) onGraded();
      fetchSubmissions(page);
    } catch (err) {
      alert(err.friendlyMessage || 'Failed to submit grade');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card modal-lg">
        <div className="modal-header">
          <div>
            <h3>Submissions: {assignment.title}</h3>
            <p className="modal-subtitle">Review student solutions and submit grades and feedback</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <div className="modal-loading">
              <div className="spinner"></div>
              <p>Loading student submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📂</span>
              <h4>No submissions received yet</h4>
              <p>Enrolled students have not submitted solutions for this assignment yet.</p>
            </div>
          ) : (
            <div className="submissions-grading-list">
              {submissions.map((sub) => {
                const isGraded = sub.grade !== null && sub.grade !== undefined;
                return (
                  <div key={sub.id} className="grading-card">
                    <div className="grading-card-header">
                      <div>
                        <h4>
                          {sub.student_first_name} {sub.student_last_name}
                        </h4>
                        <span className="student-email">{sub.student_email}</span>
                        <p className="submitted-timestamp">
                          Submitted on: {new Date(sub.submitted_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="current-grade-tag">
                        {isGraded ? (
                          <span className="grade-badge-sm">
                            Grade: <strong>{Number(sub.grade)}</strong> / 100
                          </span>
                        ) : (
                          <span className="pending-badge-sm">Not Graded</span>
                        )}
                      </div>
                    </div>

                    <div className="student-solution-box">
                      <label>Submitted Content:</label>
                      <pre className="solution-text">{sub.content}</pre>
                    </div>

                    {/* Inline Grading Form */}
                    <div className="inline-grading-form">
                      <div className="grade-input-group">
                        <label htmlFor={`grade-${sub.id}`}>Grade (0-100):</label>
                        <input
                          id={`grade-${sub.id}`}
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          className="form-control grade-input"
                          placeholder="e.g. 85"
                          value={gradeInputs[sub.id] ?? ''}
                          onChange={(e) =>
                            setGradeInputs({ ...gradeInputs, [sub.id]: e.target.value })
                          }
                          disabled={savingId === sub.id}
                        />
                      </div>

                      <div className="feedback-input-group">
                        <label htmlFor={`feedback-${sub.id}`}>Constructive Feedback:</label>
                        <textarea
                          id={`feedback-${sub.id}`}
                          rows={2}
                          className="form-control"
                          placeholder="Add feedback explaining the score and suggestions..."
                          value={feedbackInputs[sub.id] ?? ''}
                          onChange={(e) =>
                            setFeedbackInputs({ ...feedbackInputs, [sub.id]: e.target.value })
                          }
                          disabled={savingId === sub.id}
                        />
                      </div>

                      <div className="grading-action-col">
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => handleGradeSubmit(sub.id)}
                          disabled={savingId === sub.id}
                        >
                          {savingId === sub.id ? 'Saving...' : isGraded ? 'Update Grade' : 'Save Grade'}
                        </button>
                        {saveSuccessId === sub.id && (
                          <span className="save-success-tag">✓ Saved & Notified</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <Pagination pagination={pagination} onPageChange={(newPage) => setPage(newPage)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
