import React from 'react';

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total } = pagination;

  return (
    <div className="pagination-bar">
      <span className="pagination-info">
        Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total)
      </span>
      <div className="pagination-buttons">
        <button
          className="btn btn-sm btn-outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ← Previous
        </button>
        <button
          className="btn btn-sm btn-outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
