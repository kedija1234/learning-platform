import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import SubmissionModal from '../components/SubmissionModal';

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [enrollSuccess, setEnrollSuccess] = useState('');
  const [activeAssignment, setActiveAssignment] = useState(null);

  const fetchCourse = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get(`/courses/${id}`);
      setCourse(data.data?.course || null);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const handleEnroll = async () => {
    setEnrolling(true);
    setEnrollSuccess('');
    setError('');
    try {
      await apiClient.post(`/courses/${id}/enroll`);
      setEnrollSuccess('🎉 Successfully enrolled in this course!');
      fetchCourse();
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading course information...</p>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="alert alert-error" style={{ margin: '2rem 0' }}>
        <p>{error}</p>
        <Link to="/courses" className="btn btn-sm btn-outline" style={{ marginTop: '0.75rem', display: 'inline-block' }}>
          ← Back to Catalog
        </Link>
      </div>
    );
  }

  if (!course) return null;

  const isStudent = user?.role === 'student';
  const isEnrolled = course.is_enrolled;
  const progressPercent = course.progress_percent || 0;

  return (
    <div className="page-wrapper">
      <Link to="/courses" className="back-link">
        ← Back to All Courses
      </Link>

      <div className="course-detail-header">
        <div className="course-main-info">
          <span className="category-badge">{course.category || 'General'}</span>
          <h1>{course.title}</h1>
          <p className="course-instructor-sub">
            Taught by <strong>{course.mentor_first_name} {course.mentor_last_name}</strong>
          </p>
          <p className="course-full-description">{course.description || 'No course description available.'}</p>
        </div>

        {/* Enrollment Status Card */}
        {isStudent && (
          <div className="enrollment-status-card">
            <h3>Your Enrollment</h3>
            {isEnrolled ? (
              <div className="enrolled-status-content">
                <div className="status-pill status-enrolled">✓ Enrolled</div>
                <div className="progress-section">
                  <div className="progress-labels">
                    <span>Course Progress</span>
                    <strong>{progressPercent}%</strong>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="not-enrolled-content">
                <p>Enroll to access coursework, submit assignments, and earn credit.</p>
                {enrollSuccess && <div className="alert alert-success">{enrollSuccess}</div>}
                {error && <div className="alert alert-error">{error}</div>}
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="btn btn-primary btn-block"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll in Course'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="course-content-grid">
        {/* Learning Resources Column */}
        <div className="content-column">
          <div className="section-header-row">
            <h2>Learning Resources</h2>
            <span className="count-pill">{course.resources?.length || 0}</span>
          </div>

          {course.resources && course.resources.length > 0 ? (
            <div className="resources-list">
              {course.resources.map((res) => {
                const isUrl = res.link_or_text.startsWith('http://') || res.link_or_text.startsWith('https://');
                return (
                  <div key={res.id} className="resource-item">
                    <div className="resource-icon">🔗</div>
                    <div className="resource-details">
                      <h4>{res.title}</h4>
                      {isUrl ? (
                        <a href={res.link_or_text} target="_blank" rel="noopener noreferrer" className="resource-link">
                          Open Resource ↗
                        </a>
                      ) : (
                        <p className="resource-text">{res.link_or_text}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty-subtext">No reference materials published yet.</p>
          )}
        </div>

        {/* Course Assignments Column */}
        <div className="content-column">
          <div className="section-header-row">
            <h2>Assignments</h2>
            <span className="count-pill">{course.assignments?.length || 0}</span>
          </div>

          {course.assignments && course.assignments.length > 0 ? (
            <div className="assignments-list">
              {course.assignments.map((assignment) => (
                <div key={assignment.id} className="assignment-card">
                  <div className="assignment-card-header">
                    <h4>{assignment.title}</h4>
                    {assignment.due_date && (
                      <span className="due-date-tag">
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="assignment-snippet">
                    {assignment.instructions ? (assignment.instructions.length > 110 ? `${assignment.instructions.slice(0, 110)}...` : assignment.instructions) : ''}
                  </p>

                  <div className="assignment-actions">
                    {isStudent ? (
                      isEnrolled ? (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => setActiveAssignment(assignment)}
                        >
                          Submit or View Work →
                        </button>
                      ) : (
                        <span className="locked-note">🔒 Enroll to submit</span>
                      )
                    ) : (
                      <span className="role-note">Instructor assignment</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-subtext">No assignments posted for this course yet.</p>
          )}
        </div>
      </div>

      {/* Assignment Submission Modal */}
      {activeAssignment && (
        <SubmissionModal
          assignment={activeAssignment}
          courseId={course.id}
          isOpen={!!activeAssignment}
          onClose={() => setActiveAssignment(null)}
          onSuccess={fetchCourse}
        />
      )}
    </div>
  );
}
