import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

export default function SubmissionModal({ assignment, courseId, isOpen, onClose, onSuccess }) {
  const [content, setContent] = useState('');
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!isOpen || !assignment) return;

    let isMounted = true;
    async function loadSubmission() {
      setLoading(true);
      setError('');
      setSuccessMsg('');
      try {
        const { data } = await apiClient.get(`/assignments/${assignment.id}/submissions/me`);
        if (isMounted) {
          const sub = data.data?.submission;
          setExistingSubmission(sub || null);
          if (sub?.content) {
            setContent(sub.content);
          } else {
            setContent('');
          }
        }
      } catch (err) {
        // If 404 or null, it simply means no submission yet
        if (isMounted) {
          setExistingSubmission(null);
          setContent('');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSubmission();
    return () => {
      isMounted = false;
    };
  }, [isOpen, assignment]);

  if (!isOpen || !assignment) return null;

  const isGraded = existingSubmission?.grade !== null && existingSubmission?.grade !== undefined;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!content.trim()) {
      setError('Please provide submission content before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(`/assignments/${assignment.id}/submissions`, {
        content: content.trim(),
      });
      setSuccessMsg('Work submitted successfully!');
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3>{assignment.title}</h3>
            <p className="modal-subtitle">Course Assignment</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Instructions section */}
          <div className="assignment-instructions-box">
            <h4>Instructions</h4>
            <p>{assignment.instructions || 'No detailed instructions provided.'}</p>
            {assignment.due_date && (
              <p className="due-date-notice">
                ⏰ Due Date: {new Date(assignment.due_date).toLocaleString()}
              </p>
            )}
          </div>

          {loading ? (
            <div className="modal-loading">
              <div className="spinner"></div>
              <p>Checking submission status...</p>
            </div>
          ) : (
            <>
              {error && <div className="alert alert-error">{error}</div>}
              {successMsg && <div className="alert alert-success">{successMsg}</div>}

              {isGraded ? (
                /* Graded State: Read-Only with Score and Feedback */
                <div className="graded-result-box">
                  <div className="grade-score-header">
                    <span className="grade-badge-lg">
                      Score: <strong>{Number(existingSubmission.grade)}</strong> / 100
                    </span>
                    <span className="graded-status-tag">Graded</span>
                  </div>

                  {existingSubmission.feedback && (
                    <div className="mentor-feedback-quote">
                      <strong>Instructor Feedback:</strong>
                      <p>"{existingSubmission.feedback}"</p>
                    </div>
                  )}

                  <div className="submitted-work-preview">
                    <strong>Your Submitted Work:</strong>
                    <div className="work-content-display">{existingSubmission.content}</div>
                  </div>

                  <p className="grade-lock-note">
                    🔒 This submission has been graded and is locked from further edits.
                  </p>
                </div>
              ) : (
                /* Editable / New Submission Form */
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="submission_content">
                      {existingSubmission ? 'Update Your Submission:' : 'Your Answer / Solution:'}
                    </label>
                    <textarea
                      id="submission_content"
                      rows={7}
                      required
                      className="form-control"
                      placeholder="Type your solution, code, answers, or links to repository..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  {existingSubmission && !isGraded && (
                    <p className="info-note">
                      ℹ️ You previously submitted on{' '}
                      {new Date(existingSubmission.submitted_at).toLocaleDateString()}. You can
                      update your submission until your instructor grades it.
                    </p>
                  )}

                  <div className="modal-actions">
                    <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting
                        ? 'Submitting...'
                        : existingSubmission
                        ? 'Update Submission'
                        : 'Submit Assignment'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
