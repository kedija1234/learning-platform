import pool from '../../config/db.js';

/**
 * Lists users with TiDB-compatible pagination, keyword search, and filters
 */
export async function listUsers({ page = 1, limit = 10, search, role, is_active }) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const safeOffset = (safePage - 1) * safeLimit;

  const whereClauses = [];
  const params = [];

  if (search && search.trim() !== '') {
    whereClauses.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)');
    const searchTerm = `%${search.trim()}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (role && ['student', 'mentor', 'coordinator', 'admin'].includes(role.toLowerCase())) {
    whereClauses.push('role = ?');
    params.push(role.toLowerCase());
  }

  if (is_active !== undefined && is_active !== '') {
    const activeBool = is_active === true || is_active === 'true' || is_active === '1' || is_active === 1;
    whereClauses.push('is_active = ?');
    params.push(activeBool);
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Get total count matching criteria
  const [countResult] = await pool.query(
    `SELECT COUNT(*) AS total FROM users ${whereSQL}`,
    params
  );
  const total = countResult[0].total;

  // Retrieve paginated records with safe integer interpolation for LIMIT and OFFSET
  const [users] = await pool.query(
    `SELECT 
       id, 
       first_name, 
       last_name, 
       email, 
       role, 
       is_active, 
       created_at
     FROM users
     ${whereSQL}
     ORDER BY created_at DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  return {
    users,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

/**
 * Updates a user's active status (deactivate or reactivate)
 */
export async function updateUserStatus(targetUserId, isActive, adminUserId) {
  const [targetRows] = await pool.query(
    'SELECT id, first_name, last_name, email, role, is_active FROM users WHERE id = ?',
    [targetUserId]
  );

  if (targetRows.length === 0) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const target = targetRows[0];

  // Prevent admin from deactivating their own account
  if (Number(target.id) === Number(adminUserId) && !isActive) {
    const error = new Error('You cannot deactivate your own admin account');
    error.statusCode = 400;
    throw error;
  }

  await pool.query(
    'UPDATE users SET is_active = ? WHERE id = ?',
    [Boolean(isActive), targetUserId]
  );

  return {
    ...target,
    is_active: Boolean(isActive),
  };
}

/**
 * Updates a user's role
 */
export async function updateUserRole(targetUserId, newRole, adminUserId) {
  const [targetRows] = await pool.query(
    'SELECT id, first_name, last_name, email, role, is_active FROM users WHERE id = ?',
    [targetUserId]
  );

  if (targetRows.length === 0) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const target = targetRows[0];

  // Prevent admin from demoting their own account
  if (Number(target.id) === Number(adminUserId) && newRole !== 'admin') {
    const error = new Error('You cannot demote your own admin account');
    error.statusCode = 400;
    throw error;
  }

  await pool.query(
    'UPDATE users SET role = ? WHERE id = ?',
    [newRole, targetUserId]
  );

  return {
    ...target,
    role: newRole,
  };
}

/**
 * Collects system-wide counts and statistics
 */
export async function getStats() {
  // User statistics
  const [userStats] = await pool.query(`
    SELECT 
      COUNT(*) AS total_users,
      COALESCE(SUM(role = 'student'), 0) AS student_count,
      COALESCE(SUM(role = 'mentor'), 0) AS mentor_count,
      COALESCE(SUM(role = 'coordinator'), 0) AS coordinator_count,
      COALESCE(SUM(role = 'admin'), 0) AS admin_count,
      COALESCE(SUM(is_active = 1), 0) AS active_users_count,
      COALESCE(SUM(is_active = 0), 0) AS inactive_users_count
    FROM users
  `);

  // Courses count
  const [courseStats] = await pool.query('SELECT COUNT(*) AS total_courses FROM courses');

  // Enrollments count
  const [enrollmentStats] = await pool.query('SELECT COUNT(*) AS total_enrollments FROM enrollments');

  // Submissions count
  const [submissionStats] = await pool.query(`
    SELECT 
      COUNT(*) AS total_submissions,
      COALESCE(SUM(grade IS NOT NULL), 0) AS graded_submissions
    FROM submissions
  `);

  // Internships count
  const [internshipStats] = await pool.query('SELECT COUNT(*) AS total_internships FROM internships');

  // Applications count
  const [applicationStats] = await pool.query(`
    SELECT 
      COUNT(*) AS total_applications,
      COALESCE(SUM(status = 'pending'), 0) AS pending_applications,
      COALESCE(SUM(status = 'accepted'), 0) AS accepted_applications,
      COALESCE(SUM(status = 'rejected'), 0) AS rejected_applications
    FROM applications
  `);

  const u = userStats[0];
  const sub = submissionStats[0];
  const app = applicationStats[0];

  return {
    users: {
      total: Number(u.total_users),
      students: Number(u.student_count),
      mentors: Number(u.mentor_count),
      coordinators: Number(u.coordinator_count),
      admins: Number(u.admin_count),
      active: Number(u.active_users_count),
      inactive: Number(u.inactive_users_count),
    },
    courses: {
      total: Number(courseStats[0].total_courses),
    },
    enrollments: {
      total: Number(enrollmentStats[0].total_enrollments),
    },
    submissions: {
      total: Number(sub.total_submissions),
      graded: Number(sub.graded_submissions),
    },
    internships: {
      total: Number(internshipStats[0].total_internships),
    },
    applications: {
      total: Number(app.total_applications),
      pending: Number(app.pending_applications),
      accepted: Number(app.accepted_applications),
      rejected: Number(app.rejected_applications),
    },
  };
}
