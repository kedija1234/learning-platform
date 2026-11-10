import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';

export default function CoursesList() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCourses = async (targetPage = 1, searchQuery = '') => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: targetPage, limit: 9 });
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      const { data } = await apiClient.get(`/courses?${params.toString()}`);
      setCourses(data.data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses(page, search);
  }, [page, search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="page-wrapper">
      <div className="page-header courses-header">
        <div>
          <h1>Course Catalog</h1>
          <p className="page-subtitle">Discover university courses, explore curriculums, and enroll</p>
        </div>
        {(user?.role === 'mentor' || user?.role === 'admin') && (
          <Link to="/courses/new" className="btn btn-primary">
            + Create New Course
          </Link>
        )}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="search-form">
        <input
          type="text"
          className="form-control search-input"
          placeholder="Search courses by title, topic, or keyword..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="btn btn-outline">
          Search
        </button>
        {search && (
          <button type="button" className="btn btn-outline" onClick={handleClearSearch}>
            Clear
          </button>
        )}
      </form>

      {/* Error Banner */}
      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
          <button className="btn btn-sm btn-outline" style={{ marginTop: '0.5rem' }} onClick={() => fetchCourses(page, search)}>
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="cards-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="course-card skeleton-card">
              <div className="skeleton-block skeleton-badge"></div>
              <div className="skeleton-block skeleton-title"></div>
              <div className="skeleton-block skeleton-line"></div>
              <div className="skeleton-block skeleton-line-short"></div>
              <div className="skeleton-block skeleton-btn"></div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <p>{search ? 'No courses match your search criteria.' : 'There are currently no published courses available.'}</p>
          {search ? (
            <button type="button" className="btn btn-outline btn-sm" onClick={handleClearSearch} style={{ marginTop: '0.75rem' }}>
              Clear Search
            </button>
          ) : (user?.role === 'mentor' || user?.role === 'admin') ? (
            <Link to="/courses/new" className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>
              Create New Course
            </Link>
          ) : (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => fetchCourses(1, '')} style={{ marginTop: '0.75rem' }}>
              Refresh Courses
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="cards-grid">
            {courses.map((course) => (
              <div key={course.id} className="course-card">
                <div className="course-card-body">
                  <div className="course-card-header">
                    <span className="category-badge">{course.category || 'General'}</span>
                    <span className="enrolled-badge">{course.enrolled_count || 0} Enrolled</span>
                  </div>
                  <h3 className="course-title">{course.title}</h3>
                  <p className="course-desc">
                    {course.description ? (course.description.length > 130 ? `${course.description.slice(0, 130)}...` : course.description) : 'No description provided.'}
                  </p>
                  <p className="course-mentor">
                    Instructor: <strong>{course.mentor_first_name} {course.mentor_last_name}</strong>
                  </p>
                </div>
                <div className="course-card-footer">
                  <Link to={`/courses/${course.id}`} className="btn btn-outline btn-sm btn-block">
                    View Course Details →
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
