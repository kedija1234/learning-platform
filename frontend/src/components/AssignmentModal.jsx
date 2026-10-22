import React, { useState } from 'react';
import apiClient from '../api/client';

export default function AssignmentModal({ courseId, isOpen, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !instructions.trim()) {
      setError('Title and instructions are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        instructions: instructions.trim(),
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      };

      await apiClient.post(`/courses/${courseId}/assignments`, payload);
      setTitle('');
      setInstructions('');
      setDueDate('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3>Add Coursework Assignment</h3>
            <p className="modal-subtitle">Post a new assignment with submission instructions and deadlines</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="assignment_title">Assignment Title *</label>
            <input
              id="assignment_title"
              type="text"
              required
              className="form-control"
              placeholder="e.g. Assignment 1: Binary Search Tree Implementation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="due_date">Submission Due Date (Optional)</label>
            <input
              id="due_date"
              type="datetime-local"
              className="form-control"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="instructions">Instructions & Grading Criteria *</label>
            <textarea
              id="instructions"
              rows={5}
              required
              className="form-control"
              placeholder="Detail the task requirements, test cases, submission format, and rubric..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating Assignment...' : 'Publish Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
