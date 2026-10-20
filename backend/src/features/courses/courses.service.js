import pool from '../../config/db.js';

/**
 * Checks course existence and verifies whether the user is the owner or an administrator
 * @throws {Error} 404 if course not found, 403 if user not authorized
 */
async function verifyCourseOwnership(courseId, userId, userRole) {
  const [courses] = await pool.query(
    'SELECT id, mentor_id, title FROM courses WHERE id = ?',
    [courseId]
  );

  if (courses.length === 0) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  const course = courses[0];
  if (userRole !== 'admin' && course.mentor_id !== userId) {
    const error = new Error('Forbidden: You are not authorized to manage this course');
    error.statusCode = 403;
    throw error;
  }

  return course;
}

/**
 * Lists courses with TiDB-compatible pagination and search
 */
export async function listCourses({ page = 1, limit = 10, search, mentorId }) {
  // TiDB Cloud compatibility: Convert pagination bounds to safe numeric integers
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const safeOffset = (safePage - 1) * safeLimit;

  const whereClauses = [];
  const params = [];

  if (search && search.trim() !== '') {
    // Avoid FULLTEXT indexes for TiDB Cloud compatibility; use LIKE
    whereClauses.push('(c.title LIKE ? OR c.description LIKE ?)');
    const searchTerm = `%${search.trim()}%`;
    params.push(searchTerm, searchTerm);
  }

  if (mentorId) {
    whereClauses.push('c.mentor_id = ?');
    params.push(mentorId);
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Get total count matching criteria
  const [countResult] = await pool.query(
    `SELECT COUNT(*) AS total FROM courses c ${whereSQL}`,
    params
  );
  const total = countResult[0].total;

  // Retrieve paginated records with safe integer interpolation for LIMIT and OFFSET
  const [courses] = await pool.query(
    `SELECT 
       c.id, 
       c.mentor_id, 
       c.title, 
       c.description, 
       c.created_at,
       u.first_name AS mentor_first_name, 
       u.last_name AS mentor_last_name,
       (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enrolled_students_count,
       (SELECT COUNT(*) FROM assignments a WHERE a.course_id = c.id) AS assignments_count
     FROM courses c
     JOIN users u ON c.mentor_id = u.id
     ${whereSQL}
     ORDER BY c.created_at DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  return {
    courses,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

/**
 * Retrieves course details, mentor information, resources, assignments, and enrollment status
 */
export async function getCourseById(courseId, currentUserId = null) {
  const [courseRows] = await pool.query(
    `SELECT 
       c.id, 
       c.mentor_id, 
       c.title, 
       c.description, 
       c.created_at,
       u.first_name AS mentor_first_name, 
       u.last_name AS mentor_last_name,
       u.email AS mentor_email,
       (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enrolled_students_count
     FROM courses c
     JOIN users u ON c.mentor_id = u.id
     WHERE c.id = ?`,
    [courseId]
  );

  if (courseRows.length === 0) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  const course = courseRows[0];

  // Fetch course resources
  const [resources] = await pool.query(
    'SELECT id, course_id, title, link_or_text, created_at FROM resources WHERE course_id = ? ORDER BY created_at ASC',
    [courseId]
  );

  // Fetch course assignments
  const [assignments] = await pool.query(
    'SELECT id, course_id, title, instructions, due_date, created_at FROM assignments WHERE course_id = ? ORDER BY due_date ASC, created_at ASC',
    [courseId]
  );

  // Check enrollment status for the current viewer
  let isEnrolled = false;
  let progressPercent = null;

  if (currentUserId) {
    const [enrollmentRows] = await pool.query(
      'SELECT progress_percent FROM enrollments WHERE course_id = ? AND student_id = ?',
      [courseId, currentUserId]
    );
    if (enrollmentRows.length > 0) {
      isEnrolled = true;
      progressPercent = enrollmentRows[0].progress_percent;
    }
  }

  return {
    ...course,
    is_enrolled: isEnrolled,
    progress_percent: progressPercent,
    resources,
    assignments,
  };
}

/**
 * Creates a new course
 */
export async function createCourse({ mentor_id, title, description }) {
  const [result] = await pool.query(
    'INSERT INTO courses (mentor_id, title, description) VALUES (?, ?, ?)',
    [mentor_id, title.trim(), description ? description.trim() : null]
  );

  return {
    id: result.insertId,
    mentor_id,
    title: title.trim(),
    description: description ? description.trim() : null,
  };
}

/**
 * Updates an existing course
 */
export async function updateCourse(courseId, userId, userRole, { title, description }) {
  await verifyCourseOwnership(courseId, userId, userRole);

  await pool.query(
    'UPDATE courses SET title = ?, description = ? WHERE id = ?',
    [title.trim(), description ? description.trim() : null, courseId]
  );

  return getCourseById(courseId, userId);
}

/**
 * Deletes a course
 */
export async function deleteCourse(courseId, userId, userRole) {
  await verifyCourseOwnership(courseId, userId, userRole);

  await pool.query('DELETE FROM courses WHERE id = ?', [courseId]);
  return { success: true, message: 'Course deleted successfully' };
}

/**
 * Adds a resource to a course
 */
export async function addResource(courseId, userId, userRole, { title, link_or_text }) {
  await verifyCourseOwnership(courseId, userId, userRole);

  const [result] = await pool.query(
    'INSERT INTO resources (course_id, title, link_or_text) VALUES (?, ?, ?)',
    [courseId, title.trim(), link_or_text.trim()]
  );

  return {
    id: result.insertId,
    course_id: Number(courseId),
    title: title.trim(),
    link_or_text: link_or_text.trim(),
  };
}

/**
 * Removes a resource from a course
 */
export async function deleteResource(courseId, resourceId, userId, userRole) {
  await verifyCourseOwnership(courseId, userId, userRole);

  const [resRows] = await pool.query(
    'SELECT id FROM resources WHERE id = ? AND course_id = ?',
    [resourceId, courseId]
  );

  if (resRows.length === 0) {
    const error = new Error('Resource not found for this course');
    error.statusCode = 404;
    throw error;
  }

  await pool.query('DELETE FROM resources WHERE id = ?', [resourceId]);
  return { success: true, message: 'Resource deleted successfully' };
}

/**
 * Adds an assignment to a course
 */
export async function addAssignment(courseId, userId, userRole, { title, instructions, due_date }) {
  await verifyCourseOwnership(courseId, userId, userRole);

  // Convert ISO string to MySQL-compatible 'YYYY-MM-DD HH:MM:SS' format
  const formattedDueDate = due_date
    ? new Date(due_date).toISOString().slice(0, 19).replace('T', ' ')
    : null;

  const [result] = await pool.query(
    'INSERT INTO assignments (course_id, title, instructions, due_date) VALUES (?, ?, ?, ?)',
    [courseId, title.trim(), instructions.trim(), formattedDueDate]
  );

  return {
    id: result.insertId,
    course_id: Number(courseId),
    title: title.trim(),
    instructions: instructions.trim(),
    due_date: formattedDueDate,
  };
}

/**
 * Removes an assignment from a course
 */
export async function deleteAssignment(courseId, assignmentId, userId, userRole) {
  await verifyCourseOwnership(courseId, userId, userRole);

  const [assignRows] = await pool.query(
    'SELECT id FROM assignments WHERE id = ? AND course_id = ?',
    [assignmentId, courseId]
  );

  if (assignRows.length === 0) {
    const error = new Error('Assignment not found for this course');
    error.statusCode = 404;
    throw error;
  }

  await pool.query('DELETE FROM assignments WHERE id = ?', [assignmentId]);
  return { success: true, message: 'Assignment deleted successfully' };
}

/**
 * Enrolls a student in a course
 */
export async function enrollStudent(courseId, studentId) {
  // 1. Verify course exists
  const [courseRows] = await pool.query('SELECT id, title FROM courses WHERE id = ?', [courseId]);
  if (courseRows.length === 0) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Check if already enrolled
  const [existing] = await pool.query(
    'SELECT id, progress_percent FROM enrollments WHERE course_id = ? AND student_id = ?',
    [courseId, studentId]
  );

  if (existing.length > 0) {
    const error = new Error('You are already enrolled in this course');
    error.statusCode = 409;
    throw error;
  }

  // 3. Create enrollment
  const [result] = await pool.query(
    'INSERT INTO enrollments (course_id, student_id, progress_percent) VALUES (?, ?, 0)',
    [courseId, studentId]
  );

  return {
    id: result.insertId,
    course_id: Number(courseId),
    student_id: studentId,
    progress_percent: 0,
    course_title: courseRows[0].title,
  };
}

/**
 * Retrieves courses enrolled by a specific student with pagination
 */
export async function getEnrolledCourses(studentId, { page = 1, limit = 10 }) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const safeOffset = (safePage - 1) * safeLimit;

  const [countResult] = await pool.query(
    'SELECT COUNT(*) AS total FROM enrollments WHERE student_id = ?',
    [studentId]
  );
  const total = countResult[0].total;

  const [courses] = await pool.query(
    `SELECT 
       c.id, 
       c.title, 
       c.description, 
       c.mentor_id, 
       u.first_name AS mentor_first_name, 
       u.last_name AS mentor_last_name,
       e.progress_percent, 
       e.created_at AS enrolled_at
     FROM enrollments e
     JOIN courses c ON e.course_id = c.id
     JOIN users u ON c.mentor_id = u.id
     WHERE e.student_id = ?
     ORDER BY e.created_at DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    [studentId]
  );

  return {
    courses,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

/**
 * Retrieves enrolled students and their progress for a mentor's course
 */
export async function getCourseStudents(courseId, userId, userRole) {
  await verifyCourseOwnership(courseId, userId, userRole);

  const [students] = await pool.query(
    `SELECT 
       u.id, 
       u.first_name, 
       u.last_name, 
       u.email, 
       e.progress_percent, 
       e.created_at AS enrolled_at
     FROM enrollments e
     JOIN users u ON e.student_id = u.id
     WHERE e.course_id = ?
     ORDER BY u.last_name ASC, u.first_name ASC`,
    [courseId]
  );

  return students;
}

export default {
  listCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  addResource,
  deleteResource,
  addAssignment,
  deleteAssignment,
  enrollStudent,
  getEnrolledCourses,
  getCourseStudents,
};
