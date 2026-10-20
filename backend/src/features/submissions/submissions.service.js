import pool from '../../config/db.js';

/**
 * Recalculates and updates student progress_percent in the course enrollments table
 * Progress is based on the proportion of completed assignments in the course (0-100%)
 */
export async function updateCourseProgress(courseId, studentId) {
  // Count total assignments in the course
  const [assignCount] = await pool.query(
    'SELECT COUNT(*) AS total FROM assignments WHERE course_id = ?',
    [courseId]
  );
  const totalAssignments = assignCount[0].total;

  if (totalAssignments === 0) {
    await pool.query(
      'UPDATE enrollments SET progress_percent = 100 WHERE course_id = ? AND student_id = ?',
      [courseId, studentId]
    );
    return 100;
  }

  // Count distinct assignments submitted by this student in this course
  const [subCount] = await pool.query(
    `SELECT COUNT(DISTINCT s.assignment_id) AS submitted
     FROM submissions s
     JOIN assignments a ON s.assignment_id = a.id
     WHERE a.course_id = ? AND s.student_id = ?`,
    [courseId, studentId]
  );
  const submittedCount = subCount[0].submitted;

  const progressPercent = Math.min(
    100,
    Math.round((submittedCount / totalAssignments) * 100)
  );

  await pool.query(
    'UPDATE enrollments SET progress_percent = ? WHERE course_id = ? AND student_id = ?',
    [progressPercent, courseId, studentId]
  );

  return progressPercent;
}

/**
 * Submits work for an assignment
 */
export async function submitAssignment(assignmentId, studentId, { content }) {
  // 1. Verify assignment exists and retrieve its course_id
  const [assignments] = await pool.query(
    `SELECT a.id, a.course_id, a.title, c.mentor_id
     FROM assignments a
     JOIN courses c ON a.course_id = c.id
     WHERE a.id = ?`,
    [assignmentId]
  );

  if (assignments.length === 0) {
    const error = new Error('Assignment not found');
    error.statusCode = 404;
    throw error;
  }

  const assignment = assignments[0];

  // 2. Security Check: Verify student is actively enrolled in the course
  const [enrollments] = await pool.query(
    'SELECT id, progress_percent FROM enrollments WHERE course_id = ? AND student_id = ?',
    [assignment.course_id, studentId]
  );

  if (enrollments.length === 0) {
    const error = new Error('Forbidden: You must be enrolled in this course to submit work');
    error.statusCode = 403;
    throw error;
  }

  // 3. Check for existing submission
  const [existing] = await pool.query(
    'SELECT id, grade FROM submissions WHERE assignment_id = ? AND student_id = ?',
    [assignmentId, studentId]
  );

  let submissionId;

  if (existing.length > 0) {
    const currentSub = existing[0];
    if (currentSub.grade !== null && currentSub.grade !== undefined) {
      const error = new Error('Cannot resubmit work that has already been graded');
      error.statusCode = 400;
      throw error;
    }

    // Update existing submission content
    await pool.query(
      'UPDATE submissions SET content = ?, submitted_at = CURRENT_TIMESTAMP WHERE id = ?',
      [content.trim(), currentSub.id]
    );
    submissionId = currentSub.id;
  } else {
    // Insert new submission
    const [result] = await pool.query(
      'INSERT INTO submissions (assignment_id, student_id, content) VALUES (?, ?, ?)',
      [assignmentId, studentId, content.trim()]
    );
    submissionId = result.insertId;
  }

  // 4. Update student's course progress
  const progressPercent = await updateCourseProgress(assignment.course_id, studentId);

  const [rows] = await pool.query(
    `SELECT s.id, s.assignment_id, s.student_id, s.content, s.grade, s.feedback, s.submitted_at,
            a.title AS assignment_title, a.course_id
     FROM submissions s
     JOIN assignments a ON s.assignment_id = a.id
     WHERE s.id = ?`,
    [submissionId]
  );

  return {
    ...rows[0],
    course_progress_percent: progressPercent,
  };
}

/**
 * Retrieves a single submission with strict access control
 * A student can only view their own submission; course mentor and admins can view any.
 */
export async function getSubmissionById(submissionId, userId, userRole) {
  const [rows] = await pool.query(
    `SELECT 
       s.id, 
       s.assignment_id, 
       s.student_id, 
       s.content, 
       s.grade, 
       s.feedback, 
       s.submitted_at,
       a.title AS assignment_title, 
       a.instructions AS assignment_instructions, 
       a.course_id,
       c.mentor_id,
       c.title AS course_title,
       u.first_name AS student_first_name,
       u.last_name AS student_last_name,
       u.email AS student_email
     FROM submissions s
     JOIN assignments a ON s.assignment_id = a.id
     JOIN courses c ON a.course_id = c.id
     JOIN users u ON s.student_id = u.id
     WHERE s.id = ?`,
    [submissionId]
  );

  if (rows.length === 0) {
    const error = new Error('Submission not found');
    error.statusCode = 404;
    throw error;
  }

  const submission = rows[0];

  // Access Control: Students can ONLY view their own submission
  if (userRole === 'student' && submission.student_id !== userId) {
    const error = new Error('Forbidden: You are not authorized to view another student\'s submission');
    error.statusCode = 403;
    throw error;
  }

  // Mentors can only view submissions for courses they mentor
  if (userRole === 'mentor' && submission.mentor_id !== userId) {
    const error = new Error('Forbidden: You are not authorized to view submissions for this course');
    error.statusCode = 403;
    throw error;
  }

  return submission;
}

/**
 * Retrieves the current student's submission for a specific assignment
 */
export async function getStudentSubmissionForAssignment(assignmentId, studentId) {
  const [rows] = await pool.query(
    `SELECT 
       s.id, 
       s.assignment_id, 
       s.student_id, 
       s.content, 
       s.grade, 
       s.feedback, 
       s.submitted_at,
       a.title AS assignment_title,
       a.course_id
     FROM submissions s
     JOIN assignments a ON s.assignment_id = a.id
     WHERE s.assignment_id = ? AND s.student_id = ?`,
    [assignmentId, studentId]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
}

/**
 * Retrieves all submissions for an assignment (mentor/admin only, paginated)
 */
export async function getAssignmentSubmissions(assignmentId, userId, userRole, { page = 1, limit = 10 }) {
  // 1. Verify assignment exists and user is course mentor or admin
  const [assignments] = await pool.query(
    `SELECT a.id, a.course_id, a.title, c.mentor_id
     FROM assignments a
     JOIN courses c ON a.course_id = c.id
     WHERE a.id = ?`,
    [assignmentId]
  );

  if (assignments.length === 0) {
    const error = new Error('Assignment not found');
    error.statusCode = 404;
    throw error;
  }

  const assignment = assignments[0];
  if (userRole !== 'admin' && assignment.mentor_id !== userId) {
    const error = new Error('Forbidden: You are not authorized to view submissions for this assignment');
    error.statusCode = 403;
    throw error;
  }

  // 2. TiDB Cloud safe integer conversion for pagination
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const safeOffset = (safePage - 1) * safeLimit;

  // 3. Count total submissions
  const [countResult] = await pool.query(
    'SELECT COUNT(*) AS total FROM submissions WHERE assignment_id = ?',
    [assignmentId]
  );
  const total = countResult[0].total;

  // 4. Retrieve paginated submissions
  const [submissions] = await pool.query(
    `SELECT 
       s.id, 
       s.assignment_id, 
       s.student_id, 
       s.content, 
       s.grade, 
       s.feedback, 
       s.submitted_at,
       u.first_name, 
       u.last_name, 
       u.email
     FROM submissions s
     JOIN users u ON s.student_id = u.id
     WHERE s.assignment_id = ?
     ORDER BY s.submitted_at DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    [assignmentId]
  );

  return {
    submissions,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

/**
 * Retrieves submissions for the logged-in student across courses or for a specific course
 */
export async function getStudentSubmissions(studentId, { page = 1, limit = 10, courseId }) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const safeOffset = (safePage - 1) * safeLimit;

  const whereClauses = ['s.student_id = ?'];
  const params = [studentId];

  if (courseId) {
    whereClauses.push('a.course_id = ?');
    params.push(courseId);
  }

  const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;

  const [countResult] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM submissions s
     JOIN assignments a ON s.assignment_id = a.id
     ${whereSQL}`,
    params
  );
  const total = countResult[0].total;

  const [submissions] = await pool.query(
    `SELECT 
       s.id, 
       s.assignment_id, 
       s.student_id, 
       s.content, 
       s.grade, 
       s.feedback, 
       s.submitted_at,
       a.title AS assignment_title, 
       a.course_id,
       c.title AS course_title
     FROM submissions s
     JOIN assignments a ON s.assignment_id = a.id
     JOIN courses c ON a.course_id = c.id
     ${whereSQL}
     ORDER BY s.submitted_at DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  return {
    submissions,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

/**
 * Mentors grade a student submission and provide constructive feedback
 */
export async function gradeSubmission(submissionId, userId, userRole, { grade, feedback }) {
  // 1. Retrieve submission and course mentor
  const [rows] = await pool.query(
    `SELECT 
       s.id, 
       s.assignment_id, 
       s.student_id, 
       a.course_id, 
       c.mentor_id
     FROM submissions s
     JOIN assignments a ON s.assignment_id = a.id
     JOIN courses c ON a.course_id = c.id
     WHERE s.id = ?`,
    [submissionId]
  );

  if (rows.length === 0) {
    const error = new Error('Submission not found');
    error.statusCode = 404;
    throw error;
  }

  const submission = rows[0];

  // 2. Ownership check: Only course mentor or admin can grade
  if (userRole !== 'admin' && submission.mentor_id !== userId) {
    const error = new Error('Forbidden: You are not authorized to grade this submission');
    error.statusCode = 403;
    throw error;
  }

  // 3. Update grade and feedback
  const numericGrade = parseFloat(grade);
  await pool.query(
    'UPDATE submissions SET grade = ?, feedback = ? WHERE id = ?',
    [numericGrade, feedback ? feedback.trim() : null, submissionId]
  );

  // 4. Update student course progress
  const progressPercent = await updateCourseProgress(
    submission.course_id,
    submission.student_id
  );

  return getSubmissionById(submissionId, userId, userRole);
}

export default {
  submitAssignment,
  getSubmissionById,
  getStudentSubmissionForAssignment,
  getAssignmentSubmissions,
  getStudentSubmissions,
  gradeSubmission,
  updateCourseProgress,
};
