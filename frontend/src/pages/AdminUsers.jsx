import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const fetchUsers = async (targetPage = 1, currentSearch = search, currentRole = roleFilter, currentActive = activeFilter) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: targetPage, limit: 10 });
      if (currentSearch.trim()) params.append('search', currentSearch.trim());
      if (currentRole) params.append('role', currentRole);
      if (currentActive !== '') params.append('is_active', currentActive);

      const { data } = await apiClient.get(`/admin/users?${params.toString()}`);
      setUsers(data.data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load user accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page, search, roleFilter, activeFilter);
  }, [page, search, roleFilter, activeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearch('');
    setRoleFilter('');
    setActiveFilter('');
    setPage(1);
  };

  const handleToggleStatus = async (targetUser) => {
    if (Number(targetUser.id) === Number(currentUser?.id)) {
      alert('You cannot deactivate your own administrative account.');
      return;
    }

    const nextStatus = !targetUser.is_active;
    const confirmPrompt = nextStatus
      ? `Reactivate account for ${targetUser.first_name} ${targetUser.last_name}?`
      : `Deactivate account for ${targetUser.first_name} ${targetUser.last_name}? This user will no longer be able to log in.`;

    if (!window.confirm(confirmPrompt)) return;

    setUpdatingUserId(targetUser.id);
    setActionError('');
    setActionSuccess('');
    try {
      await apiClient.put(`/admin/users/${targetUser.id}/status`, { is_active: nextStatus });
      setActionSuccess(`Account for ${targetUser.first_name} ${targetUser.last_name} was successfully ${nextStatus ? 'reactivated' : 'deactivated'}.`);
      fetchUsers(page, search, roleFilter, activeFilter);
    } catch (err) {
      setActionError(err.friendlyMessage || 'Failed to update account status');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    if (newRole === targetUser.role) return;

    if (Number(targetUser.id) === Number(currentUser?.id) && newRole !== 'admin') {
      alert('You cannot demote your own admin account.');
      return;
    }

    if (!window.confirm(`Change ${targetUser.first_name} ${targetUser.last_name}'s role from ${targetUser.role} to ${newRole}?`)) {
      return;
    }

    setUpdatingUserId(targetUser.id);
    setActionError('');
    setActionSuccess('');
    try {
      await apiClient.put(`/admin/users/${targetUser.id}/role`, { role: newRole });
      setActionSuccess(`Role for ${targetUser.first_name} ${targetUser.last_name} updated to ${newRole}.`);
      fetchUsers(page, search, roleFilter, activeFilter);
    } catch (err) {
      setActionError(err.friendlyMessage || 'Failed to change user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>User Account Management</h1>
          <p className="page-subtitle">Inspect user accounts, manage permissions, toggle active status, and assign roles</p>
        </div>
      </div>

      {actionSuccess && <div className="alert alert-success">{actionSuccess}</div>}
      {actionError && <div className="alert alert-error">{actionError}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Filter and Search Bar */}
      <div className="admin-filters-bar">
        <form onSubmit={handleSearchSubmit} className="admin-search-form">
          <input
            type="text"
            className="form-control"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        <div className="admin-filter-controls">
          <select
            className="form-control"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="mentor">Mentor</option>
            <option value="coordinator">Coordinator</option>
            <option value="admin">Admin</option>
          </select>

          <select
            className="form-control"
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Deactivated Only</option>
          </select>

          {(search || roleFilter || activeFilter !== '') && (
            <button type="button" className="btn btn-outline" onClick={handleClearFilters}>
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Loading & User Table */}
      {loading ? (
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading accounts directory...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">👥</span>
          <h3>No users match your criteria</h3>
          <p>Try modifying your search query or reset the filters.</p>
          <button className="btn btn-outline btn-sm" onClick={handleClearFilters} style={{ marginTop: '0.75rem' }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Account Status</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = Number(u.id) === Number(currentUser?.id);
                const isBusy = updatingUserId === u.id;

                return (
                  <tr key={u.id} className={!u.is_active ? 'row-deactivated' : ''}>
                    <td>
                      <div className="user-name-cell">
                        <strong>
                          {u.first_name} {u.last_name}
                          {isSelf && <span className="self-pill">You</span>}
                        </strong>
                        <span className="user-email-sub">{u.email}</span>
                      </div>
                    </td>

                    <td>
                      <select
                        className="role-selector-input"
                        value={u.role}
                        disabled={isSelf || isBusy}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        title={isSelf ? 'You cannot change your own admin role' : 'Change user role'}
                      >
                        <option value="student">Student</option>
                        <option value="mentor">Mentor</option>
                        <option value="coordinator">Coordinator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    <td>
                      <span className={`status-pill ${u.is_active ? 'status-accepted' : 'status-rejected'}`}>
                        {u.is_active ? '✓ Active' : '✕ Deactivated'}
                      </span>
                    </td>

                    <td className="created-date-cell">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    <td>
                      <div className="table-actions-cell">
                        {isSelf ? (
                          <span className="protected-note">Active Admin</span>
                        ) : (
                          <button
                            type="button"
                            className={`btn btn-xs ${u.is_active ? 'btn-outline-danger' : 'btn-success'}`}
                            onClick={() => handleToggleStatus(u)}
                            disabled={isBusy}
                          >
                            {isBusy
                              ? 'Saving...'
                              : u.is_active
                              ? 'Deactivate'
                              : 'Reactivate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <Pagination pagination={pagination} onPageChange={(newPage) => setPage(newPage)} />
        </div>
      )}
    </div>
  );
}
