/**
 * Phase 4 - Submissions Test Suite
 *
 * Covers:
 *  - Non-enrolled student blocked from submitting (403)
 *  - Enrolled student submits work (201)
 *  - Re-submit before grading updates content, same row (201)
 *  - progress_percent updates correctly after submission
 *  - Student views own submission (200)
 *  - Another student blocked from viewing (403)
 *  - Non-owning mentor blocked from listing submissions (403)
 *  - Owning mentor lists all submissions with pagination (200)
 *  - Grade outside 0-100 rejected (400)
 *  - Negative grade rejected (400)
 *  - Student forbidden from grading (403)
 *  - Non-owning mentor forbidden from grading (403)
 *  - Owning mentor grades submission (200)
 *  - Student receives notification after grading (DB check)
 *  - Student cannot resubmit after grading (400)
 *  - Student views submission with grade and feedback (200)
 *  - Student views full submission history (200)
 *  - Student retrieves their submission for a specific assignment (200)
 */

process.env.NODE_ENV = 'test'; // suppress 4xx logs in errorHandler

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import pool from '../src/config/db.js';

// ---------- helpers ----------------------------------------------------------

let server;
let baseUrl;

async function api(method, path, body, token) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, body: json };
}

// ---------- shared state -----------------------------------------------------

let mentorToken, studentToken, student2Token, otherMentorToken;
let studentId;
let courseId, assignmentId, submissionId;

// Unique tag makes cleanup easy without hard-coding IDs
const TAG = 'test_sub_';

// ---------- setup / teardown -------------------------------------------------

async function cleanUp() {
  // Remove notifications for tagged users
  await pool.query(
    `DELETE n FROM notifications n
       JOIN users u ON n.user_id = u.id
      WHERE u.email LIKE ?`,
    [`%${TAG}%`]
  );
  // Remove submissions (FK: submissions -> assignments -> courses)
  await pool.query(
    `DELETE s FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       JOIN courses c ON a.course_id = c.id
      WHERE c.title LIKE ?`,
    [`%${TAG}%`]
  );
  await pool.query('DELETE FROM courses WHERE title LIKE ?', [`%${TAG}%`]);
  await pool.query('DELETE FROM users  WHERE email  LIKE ?', [`%${TAG}%`]);
}

describe('Submissions - Phase 4', () => {

  before(async () => {
    await cleanUp(); // remove any stale records from a previous failed run

    // Start ephemeral test server on a random open port
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${server.address().port}/api`;
        resolve();
      });
    });

    // Register owning mentor
    const m = await api('POST', '/auth/register', {
      first_name: 'Sub', last_name: 'Mentor',
      email: `${TAG}mentor@example.com`,
      password: 'Passw0rd!', role: 'mentor',
    });
    mentorToken = m.body.data?.token;

    // Register a second mentor who does NOT own the course
    const om = await api('POST', '/auth/register', {
      first_name: 'Other', last_name: 'Mentor',
      email: `${TAG}othermentor@example.com`,
      password: 'Passw0rd!', role: 'mentor',
    });
    otherMentorToken = om.body.data?.token;

    // Register student 1 (will enroll)
    const s1 = await api('POST', '/auth/register', {
      first_name: 'Sub', last_name: 'Student1',
      email: `${TAG}student1@example.com`,
      password: 'Passw0rd!', role: 'student',
    });
    studentToken = s1.body.data?.token;
    studentId = s1.body.data?.user?.id;

    // Register student 2 (will NOT enroll - used for access-denial tests)
    const s2 = await api('POST', '/auth/register', {
      first_name: 'Sub', last_name: 'Student2',
      email: `${TAG}student2@example.com`,
      password: 'Passw0rd!', role: 'student',
    });
    student2Token = s2.body.data?.token;

    // Owning mentor creates a course
    const course = await api('POST', '/courses', {
      title: `${TAG}course`, description: 'Submissions test course', category: 'Testing',
    }, mentorToken);
    courseId = course.body.data?.course?.id;

    // Mentor adds an assignment to the course
    const assignment = await api('POST', `/courses/${courseId}/assignments`, {
      title: `${TAG}assignment`,
      instructions: 'Submit your best work',
      due_date: '2030-12-31T23:59:59Z',
      max_grade: 100,
    }, mentorToken);
    assignmentId = assignment.body.data?.assignment?.id;

    // Student 1 enrolls in the course
    await api('POST', `/courses/${courseId}/enroll`, null, studentToken);
  });

  after(async () => {
    await cleanUp();
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await pool.end();
  });

  // ---------- tests ----------------------------------------------------------

  it('non-enrolled student cannot submit (403)', async () => {
    const { status, body } = await api(
      'POST', `/assignments/${assignmentId}/submissions`,
      { content: 'I am not enrolled!' }, student2Token
    );
    assert.equal(status, 403, JSON.stringify(body));
  });

  it('enrolled student submits work (201)', async () => {
    const { status, body } = await api(
      'POST', `/assignments/${assignmentId}/submissions`,
      { content: 'My first submission content.' }, studentToken
    );
    assert.equal(status, 201, JSON.stringify(body));
    assert.ok(body.data?.submission?.id, 'should return a submission id');
    submissionId = body.data.submission.id; // save for later tests
  });

  it('student can update submission before grading - same row (201)', async () => {
    const { status, body } = await api(
      'POST', `/assignments/${assignmentId}/submissions`,
      { content: 'Updated submission content.' }, studentToken
    );
    assert.equal(status, 201, JSON.stringify(body));
    // Must return the SAME id - not a new row
    assert.equal(
      body.data?.submission?.id, submissionId,
      'should update existing submission, not insert a new one'
    );
  });

  it('progress_percent reaches 100 after submitting the only assignment', async () => {
    const [rows] = await pool.query(
      'SELECT progress_percent FROM enrollments WHERE course_id = ? AND student_id = ?',
      [courseId, studentId]
    );
    assert.equal(rows.length, 1, 'enrollment row must exist');
    assert.equal(rows[0].progress_percent, 100, 'progress should be 100% after submitting all assignments');
  });

  it('student can view their own submission (200)', async () => {
    const { status, body } = await api('GET', `/submissions/${submissionId}`, null, studentToken);
    assert.equal(status, 200, JSON.stringify(body));
    assert.equal(body.data?.submission?.id, submissionId);
  });

  it('another student cannot view someone elses submission (403)', async () => {
    const { status } = await api('GET', `/submissions/${submissionId}`, null, student2Token);
    assert.equal(status, 403);
  });

  it('non-owning mentor cannot list submissions for the assignment (403)', async () => {
    const { status } = await api(
      'GET', `/assignments/${assignmentId}/submissions`, null, otherMentorToken
    );
    assert.equal(status, 403);
  });

  it('owning mentor can list all submissions for an assignment with pagination (200)', async () => {
    const { status, body } = await api(
      'GET', `/assignments/${assignmentId}/submissions`, null, mentorToken
    );
    assert.equal(status, 200, JSON.stringify(body));
    // Controller returns: { success, data: submissions[], pagination: {...} }
    assert.ok(Array.isArray(body.data), 'data should be an array of submissions');
    assert.ok(body.data.length >= 1, 'at least 1 submission should be returned');
    assert.ok(body.pagination?.total >= 1, 'pagination.total should be at least 1');
  });

  it('grade above 100 is rejected (400)', async () => {
    const { status, body } = await api(
      'PUT', `/submissions/${submissionId}/grade`,
      { grade: 150, feedback: 'Way over the limit!' }, mentorToken
    );
    assert.equal(status, 400, JSON.stringify(body));
  });

  it('negative grade is rejected (400)', async () => {
    const { status } = await api(
      'PUT', `/submissions/${submissionId}/grade`,
      { grade: -5, feedback: 'Below zero!' }, mentorToken
    );
    assert.equal(status, 400);
  });

  it('student is forbidden from grading (403)', async () => {
    const { status } = await api(
      'PUT', `/submissions/${submissionId}/grade`,
      { grade: 90, feedback: 'Grading myself!' }, studentToken
    );
    assert.equal(status, 403);
  });

  it('non-owning mentor cannot grade a submission in another mentors course (403)', async () => {
    const { status } = await api(
      'PUT', `/submissions/${submissionId}/grade`,
      { grade: 75, feedback: 'Not my course!' }, otherMentorToken
    );
    assert.equal(status, 403);
  });

  it('owning mentor can grade a submission (200)', async () => {
    const { status, body } = await api(
      'PUT', `/submissions/${submissionId}/grade`,
      { grade: 88, feedback: 'Great work, well structured.' }, mentorToken
    );
    assert.equal(status, 200, JSON.stringify(body));
    assert.equal(Number(body.data?.submission?.grade), 88, 'grade should be saved as 88');
    assert.ok(body.data?.submission?.feedback, 'feedback should be present');
  });

  it('student receives a notification after their submission is graded', async () => {
    // Check the notifications table for a grading notification sent to this student
    const [rows] = await pool.query(
      `SELECT id, type, message FROM notifications WHERE user_id = ? AND type = 'submission_graded' ORDER BY id DESC`,
      [studentId]
    );
    assert.ok(rows.length >= 1, 'at least one grading notification should exist');
    assert.ok(rows[0].message.length > 0, 'notification message should not be empty');
  });

  it('student cannot resubmit after grading (400)', async () => {
    const { status, body } = await api(
      'POST', `/assignments/${assignmentId}/submissions`,
      { content: 'Trying to resubmit after grading.' }, studentToken
    );
    assert.equal(status, 400, JSON.stringify(body));
  });

  it('student views submission with grade and feedback populated (200)', async () => {
    const { status, body } = await api('GET', `/submissions/${submissionId}`, null, studentToken);
    assert.equal(status, 200, JSON.stringify(body));
    assert.equal(Number(body.data?.submission?.grade), 88);
    assert.ok(body.data?.submission?.feedback, 'feedback should be present');
  });

  it('student views full submission history across all courses (200)', async () => {
    const { status, body } = await api('GET', '/submissions/me', null, studentToken);
    assert.equal(status, 200, JSON.stringify(body));
    // Controller returns: { success, data: submissions[], pagination: {...} }
    assert.ok(Array.isArray(body.data), 'data should be an array');
    assert.ok(body.data.length >= 1, 'at least 1 submission in history');
  });

  it('student retrieves their submission for a specific assignment (200)', async () => {
    const { status, body } = await api(
      'GET', `/assignments/${assignmentId}/submissions/me`, null, studentToken
    );
    assert.equal(status, 200, JSON.stringify(body));
    assert.equal(body.data?.submission?.assignment_id, assignmentId);
  });

});
