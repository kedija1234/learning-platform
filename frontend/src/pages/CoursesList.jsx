import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import Pagination from '../components/Pagination';

export default function CoursesList() {
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
      <div className="page-header">
        <div>
          <h1>Course Catalog</h1>
          <p className="page-subtitle">Discover university courses, explore curriculums, and enroll</p>
        </div>
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
        <button type="submit" className="btn btn-primary">
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
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading course catalog...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <h3>No courses found</h3>
          <p>{search ? `No courses matching "${search}". Try different keywords.` : 'There are currently no published courses.'}</p>
          {search && (
            <button className="btn btn-outline btn-sm" onClick={handleClearSearch} style={{ marginTop: '1rem' }}>
              Reset Search
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
                    <span className="enrolled-badge">👥 {course.enrolled_count || 0} Enrolled</span>
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
                  <Link to={`/courses/${course.id}`} className="btn btn-primary btn-sm btn-block">
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
