import React, { useState } from 'react';
import apiClient from '../api/client';

export default function ResourceModal({ courseId, isOpen, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [linkOrText, setLinkOrText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !linkOrText.trim()) {
      setError('Both title and link/text are required.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(`/courses/${courseId}/resources`, {
        title: title.trim(),
        link_or_text: linkOrText.trim(),
      });
      setTitle('');
      setLinkOrText('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to add learning resource');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3>Add Learning Resource</h3>
            <p className="modal-subtitle">Attach reference materials, slides, or links for enrolled students</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="resource_title">Resource Title *</label>
            <input
              id="resource_title"
              type="text"
              required
              className="form-control"
              placeholder="e.g. Lecture 1 Slides (PDF) or Documentation Link"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="link_or_text">Resource Link or Text Content *</label>
            <textarea
              id="link_or_text"
              rows={4}
              required
              className="form-control"
              placeholder="Paste a URL (https://...) or write instructional text/reading references..."
              value={linkOrText}
              onChange={(e) => setLinkOrText(e.target.value)}
              disabled={submitting}
            />
            <small className="help-text">
              Tip: If you enter a web URL starting with <code>http://</code> or <code>https://</code>, students will get a clickable link.
            </small>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding Resource...' : 'Add Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
