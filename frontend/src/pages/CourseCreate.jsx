import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';

export default function CourseCreate() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Computer Science',
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

    if (!formData.title.trim()) {
      setError('Course title is required');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await apiClient.post('/courses', {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
      });

      const newCourseId = data.data?.course?.id;
      if (newCourseId) {
        navigate(`/courses/${newCourseId}`);
      } else {
        navigate('/courses');
      }
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Link to="/courses" className="back-link">
        ← Back to Courses
      </Link>

      <div className="form-card-container">
        <div className="form-card-header">
          <h1>Create New Course</h1>
          <p className="page-subtitle">Publish a new course curriculum for students to enroll in</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="standard-form">
          <div className="form-group">
            <label htmlFor="title">Course Title *</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className="form-control"
              placeholder="e.g. CS101: Introduction to Algorithms & Data Structures"
              value={formData.title}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Academic Department / Category</label>
            <select
              id="category"
              name="category"
              className="form-control"
              value={formData.category}
              onChange={handleChange}
              disabled={submitting}
            >
              <option value="Computer Science">Computer Science</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="Data Science & AI">Data Science & AI</option>
              <option value="Information Systems">Information Systems</option>
              <option value="Business & Management">Business & Management</option>
              <option value="General Engineering">General Engineering</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Course Description & Overview</label>
            <textarea
              id="description"
              name="description"
              rows={6}
              className="form-control"
              placeholder="Describe the course syllabus, prerequisites, learning outcomes, and expectations..."
              value={formData.description}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          <div className="form-actions-row">
            <Link to="/courses" className="btn btn-outline" disabled={submitting}>
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Publishing Course...' : 'Publish Course →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
