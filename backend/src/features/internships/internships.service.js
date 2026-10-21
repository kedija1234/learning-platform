import pool from '../../config/db.js';

/**
 * Normalizes ISO date string or Date object to MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
 * TiDB and MySQL DATETIME columns reject ISO 8601 strings with trailing "Z"
 */
function formatDateForDb(dateValue) {
  if (!dateValue) return null;
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Lists all internships with optional search and pagination
 * TiDB Cloud compatible: safe integer interpolation for LIMIT/OFFSET, LIKE for search
 */
export async function listInternships({ page = 1, limit = 10, search, studentId }) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const safeOffset = (safePage - 1) * safeLimit;

  const whereClauses = [];
  const params = [];

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    whereClauses.push('(i.title LIKE ? OR i.organization_name LIKE ? OR i.description LIKE ?)');
    params.push(term, term, term);
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Count total matching internships
  const [countResult] = await pool.query(
    `SELECT COUNT(*) AS total FROM internships i ${whereSQL}`,
    params
  );
  const total = countResult[0].total;

  // Retrieve paginated records
  let querySQL;
  let queryParams;

  if (studentId) {
    querySQL = `
      SELECT 
        i.id,
        i.coordinator_id,
        i.title,
        i.organization_name,
        i.description,
        i.deadline,
        i.created_at,
        u.first_name AS coordinator_first_name,
        u.last_name AS coordinator_last_name,
        u.email AS coordinator_email,
        (SELECT COUNT(*) FROM applications WHERE internship_id = i.id) AS application_count,
        (SELECT status FROM applications WHERE internship_id = i.id AND student_id = ?) AS my_application_status
      FROM internships i
      JOIN users u ON i.coordinator_id = u.id
      ${whereSQL}
      ORDER BY i.created_at DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;
    queryParams = [studentId, ...params];
  } else {
    querySQL = `
      SELECT 
        i.id,
        i.coordinator_id,
        i.title,
        i.organization_name,
        i.description,
        i.deadline,
        i.created_at,
        u.first_name AS coordinator_first_name,
        u.last_name AS coordinator_last_name,
        u.email AS coordinator_email,
        (SELECT COUNT(*) FROM applications WHERE internship_id = i.id) AS application_count,
        NULL AS my_application_status
      FROM internships i
      JOIN users u ON i.coordinator_id = u.id
      ${whereSQL}
      ORDER BY i.created_at DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;
    queryParams = params;
  }

  const [internships] = await pool.query(querySQL, queryParams);

  return {
    internships,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

/**
 * Retrieves a single internship by ID
 */
export async function getInternshipById(id, studentId = null) {
  let querySQL;
  let params;

  if (studentId) {
    querySQL = `
      SELECT 
        i.id,
        i.coordinator_id,
        i.title,
        i.organization_name,
        i.description,
        i.deadline,
        i.created_at,
        u.first_name AS coordinator_first_name,
        u.last_name AS coordinator_last_name,
        u.email AS coordinator_email,
        (SELECT COUNT(*) FROM applications WHERE internship_id = i.id) AS application_count,
        (SELECT status FROM applications WHERE internship_id = i.id AND student_id = ?) AS my_application_status
      FROM internships i
      JOIN users u ON i.coordinator_id = u.id
      WHERE i.id = ?
    `;
    params = [studentId, id];
  } else {
    querySQL = `
      SELECT 
        i.id,
        i.coordinator_id,
        i.title,
        i.organization_name,
        i.description,
        i.deadline,
        i.created_at,
        u.first_name AS coordinator_first_name,
        u.last_name AS coordinator_last_name,
        u.email AS coordinator_email,
        (SELECT COUNT(*) FROM applications WHERE internship_id = i.id) AS application_count,
        NULL AS my_application_status
      FROM internships i
      JOIN users u ON i.coordinator_id = u.id
      WHERE i.id = ?
    `;
    params = [id];
  }

  const [rows] = await pool.query(querySQL, params);

  if (rows.length === 0) {
    const error = new Error('Internship not found');
    error.statusCode = 404;
    throw error;
  }

  return rows[0];
}

/**
 * Creates a new internship posting (coordinator or admin only)
 */
export async function createInternship(coordinatorId, { title, organization_name, description, deadline }) {
  const formattedDeadline = formatDateForDb(deadline);

  const [result] = await pool.query(
    `INSERT INTO internships (coordinator_id, title, organization_name, description, deadline)
     VALUES (?, ?, ?, ?, ?)`,
    [coordinatorId, title.trim(), organization_name.trim(), description.trim(), formattedDeadline]
  );

  return getInternshipById(result.insertId);
}

/**
 * Updates an internship posting (owning coordinator or admin only)
 */
export async function updateInternship(id, userId, userRole, updates) {
  const internship = await getInternshipById(id);

  if (userRole !== 'admin' && internship.coordinator_id !== userId) {
    const error = new Error('Forbidden: You are not authorized to update this internship');
    error.statusCode = 403;
    throw error;
  }

  const setClauses = [];
  const params = [];

  if (updates.title !== undefined) {
    setClauses.push('title = ?');
    params.push(updates.title.trim());
  }

  if (updates.organization_name !== undefined) {
    setClauses.push('organization_name = ?');
    params.push(updates.organization_name.trim());
  }

  if (updates.description !== undefined) {
    setClauses.push('description = ?');
    params.push(updates.description.trim());
  }

  if (updates.deadline !== undefined) {
    setClauses.push('deadline = ?');
    params.push(formatDateForDb(updates.deadline));
  }

  if (setClauses.length > 0) {
    params.push(id);
    await pool.query(
      `UPDATE internships SET ${setClauses.join(', ')} WHERE id = ?`,
      params
    );
  }

  return getInternshipById(id);
}

/**
 * Deletes an internship posting (owning coordinator or admin only)
 */
export async function deleteInternship(id, userId, userRole) {
  const internship = await getInternshipById(id);

  if (userRole !== 'admin' && internship.coordinator_id !== userId) {
    const error = new Error('Forbidden: You are not authorized to delete this internship');
    error.statusCode = 403;
    throw error;
  }

  await pool.query('DELETE FROM internships WHERE id = ?', [id]);
  return { message: 'Internship deleted successfully' };
}

/**
 * Applies for an internship posting (student only)
 */
export async function applyToInternship(internshipId, studentId) {
  const internship = await getInternshipById(internshipId);

  // Check if application deadline has passed
  if (internship.deadline) {
    const deadlineDate = new Date(internship.deadline);
    if (!isNaN(deadlineDate.getTime()) && new Date() > deadlineDate) {
      const error = new Error('Cannot apply: The deadline for this internship has passed');
      error.statusCode = 400;
      throw error;
    }
  }

  // Check for duplicate application
  const [existing] = await pool.query(
    'SELECT id FROM applications WHERE internship_id = ? AND student_id = ?',
    [internshipId, studentId]
  );

  if (existing.length > 0) {
    const error = new Error('Conflict: You have already applied for this internship');
    error.statusCode = 409;
    throw error;
  }

  // Insert application
  const [result] = await pool.query(
    'INSERT INTO applications (internship_id, student_id, status) VALUES (?, ?, "pending")',
    [internshipId, studentId]
  );

  // Fetch applicant name for notification
  const [studentRows] = await pool.query(
    'SELECT first_name, last_name FROM users WHERE id = ?',
    [studentId]
  );
  const applicantName = studentRows.length > 0 
    ? `${studentRows[0].first_name} ${studentRows[0].last_name}`
    : 'A student';

  // Notify the coordinator
  await pool.query(
    `INSERT INTO notifications (user_id, type, message, link_path)
     VALUES (?, 'application_received', ?, ?)`,
    [
      internship.coordinator_id,
      `New application received from ${applicantName} for "${internship.title}".`,
      `/internships/${internshipId}/applications`,
    ]
  );

  const [createdApp] = await pool.query(
    `SELECT a.id, a.internship_id, a.student_id, a.status, a.created_at,
            i.title AS internship_title, i.organization_name
     FROM applications a
     JOIN internships i ON a.internship_id = i.id
     WHERE a.id = ?`,
    [result.insertId]
  );

  return createdApp[0];
}

/**
 * Retrieves the logged-in student's application history across internships
 */
export async function getStudentApplications(studentId, { page = 1, limit = 10 }) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const safeOffset = (safePage - 1) * safeLimit;

  const [countResult] = await pool.query(
    'SELECT COUNT(*) AS total FROM applications WHERE student_id = ?',
    [studentId]
  );
  const total = countResult[0].total;

  const [applications] = await pool.query(
    `SELECT 
       a.id,
       a.internship_id,
       a.student_id,
       a.status,
       a.created_at,
       i.title AS internship_title,
       i.organization_name,
       i.deadline,
       u.first_name AS coordinator_first_name,
       u.last_name AS coordinator_last_name
     FROM applications a
     JOIN internships i ON a.internship_id = i.id
     JOIN users u ON i.coordinator_id = u.id
     WHERE a.student_id = ?
     ORDER BY a.created_at DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    [studentId]
  );

  return {
    applications,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

/**
 * Retrieves all applications for a specific internship (owning coordinator or admin only)
 */
export async function getInternshipApplications(internshipId, userId, userRole, { page = 1, limit = 10, status }) {
  const internship = await getInternshipById(internshipId);

  if (userRole !== 'admin' && internship.coordinator_id !== userId) {
    const error = new Error('Forbidden: You are not authorized to view applications for this internship');
    error.statusCode = 403;
    throw error;
  }

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const safeOffset = (safePage - 1) * safeLimit;

  const whereClauses = ['a.internship_id = ?'];
  const params = [internshipId];

  if (status && ['pending', 'accepted', 'rejected'].includes(status.toLowerCase())) {
    whereClauses.push('a.status = ?');
    params.push(status.toLowerCase());
  }

  const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;

  const [countResult] = await pool.query(
    `SELECT COUNT(*) AS total FROM applications a ${whereSQL}`,
    params
  );
  const total = countResult[0].total;

  const [applications] = await pool.query(
    `SELECT 
       a.id,
       a.internship_id,
       a.student_id,
       a.status,
       a.created_at,
       u.first_name,
       u.last_name,
       u.email
     FROM applications a
     JOIN users u ON a.student_id = u.id
     ${whereSQL}
     ORDER BY a.created_at DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  return {
    applications,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

/**
 * Updates application status to accepted or rejected and notifies student
 * (owning coordinator or admin only)
 */
export async function updateApplicationStatus(internshipId, applicationId, userId, userRole, { status }) {
  const internship = await getInternshipById(internshipId);

  if (userRole !== 'admin' && internship.coordinator_id !== userId) {
    const error = new Error('Forbidden: You are not authorized to manage applications for this internship');
    error.statusCode = 403;
    throw error;
  }

  const [rows] = await pool.query(
    `SELECT a.id, a.internship_id, a.student_id, a.status,
            u.first_name, u.last_name, u.email
     FROM applications a
     JOIN users u ON a.student_id = u.id
     WHERE a.id = ? AND a.internship_id = ?`,
    [applicationId, internshipId]
  );

  if (rows.length === 0) {
    const error = new Error('Application not found for this internship');
    error.statusCode = 404;
    throw error;
  }

  const application = rows[0];

  // Update application status
  await pool.query(
    'UPDATE applications SET status = ? WHERE id = ?',
    [status, applicationId]
  );

  // Send notification to the student
  const notificationMessage = `Your application for "${internship.title}" at "${internship.organization_name}" was ${status}.`;
  await pool.query(
    `INSERT INTO notifications (user_id, type, message, link_path)
     VALUES (?, 'application_status_updated', ?, ?)`,
    [
      application.student_id,
      notificationMessage,
      `/internships/${internshipId}`,
    ]
  );

  return {
    ...application,
    status,
  };
}

export default {
  listInternships,
  getInternshipById,
  createInternship,
  updateInternship,
  deleteInternship,
  applyToInternship,
  getStudentApplications,
  getInternshipApplications,
  updateApplicationStatus,
};
