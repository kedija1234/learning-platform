import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';

export default function InternshipsList() {
  const { user } = useAuth();
  const [internships, setInternships] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyingId, setApplyingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchInternships = async (targetPage = 1, searchQuery = '') => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: targetPage, limit: 9 });
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      const { data } = await apiClient.get(`/internships?${params.toString()}`);
      setInternships(data.data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load internship listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships(page, search);
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

  const handleQuickApply = async (internshipId, title) => {
    setApplyingId(internshipId);
    setError('');
    setActionSuccess('');
    try {
      await apiClient.post(`/internships/${internshipId}/apply`);
      setActionSuccess(`🎉 Successfully applied for "${title}"!`);
      fetchInternships(page, search);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to apply for internship');
    } finally {
      setApplyingId(null);
    }
  };

  const isStudent = user?.role === 'student';

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>Internship Opportunities</h1>
          <p className="page-subtitle">Discover positions at corporate partners and submit applications</p>
        </div>
        {(user?.role === 'coordinator' || user?.role === 'admin') && (
          <Link to="/internships/new" className="btn btn-primary">
            + Post New Internship
          </Link>
        )}
      </div>

      {actionSuccess && <div className="alert alert-success">{actionSuccess}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="search-form">
        <input
          type="text"
          className="form-control search-input"
          placeholder="Search by role, company name, or skills..."
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

      {/* Loading State */}
      {loading ? (
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading opportunities...</p>
        </div>
      ) : internships.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">💼</span>
          <h3>No internship opportunities found</h3>
          <p>{search ? `No listings matching "${search}".` : 'There are currently no active internship postings.'}</p>
          {search && (
            <button className="btn btn-outline btn-sm" onClick={handleClearSearch} style={{ marginTop: '1rem' }}>
              Reset Search
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="cards-grid">
            {internships.map((item) => {
              const isPastDeadline = item.deadline && new Date() > new Date(item.deadline);
              const hasApplied = !!item.my_application_status;

              return (
                <div key={item.id} className="internship-card">
                  <div className="internship-card-body">
                    <div className="internship-card-header">
                      <span className="company-badge">🏢 {item.organization_name}</span>
                      {hasApplied && (
                        <span className={`status-pill status-${item.my_application_status}`}>
                          {item.my_application_status === 'accepted' ? '✓ Accepted' : item.my_application_status === 'rejected' ? '✕ Rejected' : 'Applied (Pending)'}
                        </span>
                      )}
                    </div>

                    <h3 className="internship-title">{item.title}</h3>

                    <p className="internship-desc">
                      {item.description ? (item.description.length > 130 ? `${item.description.slice(0, 130)}...` : item.description) : 'No description provided.'}
                    </p>

                    <div className="internship-meta">
                      {item.deadline ? (
                        <span className={`deadline-tag ${isPastDeadline ? 'deadline-expired' : ''}`}>
                          {isPastDeadline ? '⛔ Deadline Passed' : `⏰ Deadline: ${new Date(item.deadline).toLocaleDateString()}`}
                        </span>
                      ) : (
                        <span className="deadline-tag">Rolling Admissions</span>
                      )}
                      <span className="applicant-count">👥 {item.application_count || 0} Applicants</span>
                    </div>
                  </div>

                  <div className="internship-card-footer">
                    <Link to={`/internships/${item.id}`} className="btn btn-outline btn-sm">
                      Details
                    </Link>

                    {isStudent && (
                      hasApplied ? (
                        <button className="btn btn-sm btn-outline" disabled>
                          Already Applied
                        </button>
                      ) : isPastDeadline ? (
                        <button className="btn btn-sm btn-outline" disabled>
                          Closed
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleQuickApply(item.id, item.title)}
                          disabled={applyingId === item.id}
                        >
                          {applyingId === item.id ? 'Applying...' : 'Apply Now →'}
                        </button>
                      )
                    )}
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
