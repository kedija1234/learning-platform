import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';

export default function InternshipCreate() {
  const [formData, setFormData] = useState({
    title: '',
    organization_name: '',
    deadline: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || formData.title.trim().length < 3) {
      setError('Title must be at least 3 characters long');
      return;
    }

    if (!formData.organization_name.trim() || formData.organization_name.trim().length < 2) {
      setError('Organization name must be at least 2 characters long');
      return;
    }

    if (!formData.description.trim() || formData.description.trim().length < 10) {
      setError('Description must be at least 10 characters long');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        organization_name: formData.organization_name.trim(),
        description: formData.description.trim(),
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
      };

      const { data } = await apiClient.post('/internships', payload);
      const newInternshipId = data.data?.internship?.id;

      if (newInternshipId) {
        navigate(`/internships/${newInternshipId}`);
      } else {
        navigate('/internships');
      }
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to post internship opportunity');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Link to="/internships" className="back-link">
        ← Back to Internships
      </Link>

      <div className="form-card-container">
        <div className="form-card-header">
          <h1>Post New Internship Opportunity</h1>
          <p className="page-subtitle">
            Publish an internship listing from university partners. Students will receive an instant notification.
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="standard-form">
          <div className="form-group">
            <label htmlFor="title">Position / Role Title *</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className="form-control"
              placeholder="e.g. Software Engineering Intern (Summer 2026)"
              value={formData.title}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="organization_name">Organization / Company Name *</label>
            <input
              id="organization_name"
              name="organization_name"
              type="text"
              required
              className="form-control"
              placeholder="e.g. Google, Microsoft, or Local Tech Partner"
              value={formData.organization_name}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="deadline">Application Deadline (Optional)</label>
            <input
              id="deadline"
              name="deadline"
              type="datetime-local"
              className="form-control"
              value={formData.deadline}
              onChange={handleChange}
              disabled={submitting}
            />
            <small className="help-text">
              Leave blank for rolling admissions without a strict closing deadline.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="description">Role Description, Requirements & Qualifications *</label>
            <textarea
              id="description"
              name="description"
              rows={8}
              required
              className="form-control"
              placeholder="Describe the day-to-day responsibilities, required skills (e.g. React, Node.js, Python), eligibility, and interview process..."
              value={formData.description}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          <div className="form-actions-row">
            <Link to="/internships" className="btn btn-outline" disabled={submitting}>
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Publishing Opportunity...' : 'Post Internship Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
