process.env.NODE_ENV = 'test';

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import pool from '../src/config/db.js';

let server;
let baseUrl;

const timestamp = Date.now();
const mentorUser = {
  first_name: 'Course',
  last_name: 'Mentor',
  email: `mentor_test_course_${timestamp}@example.com`,
  password: 'Password123!',
  role: 'mentor',
};

const otherMentorUser = {
  first_name: 'Other',
  last_name: 'Mentor',
  email: `other_mentor_test_course_${timestamp}@example.com`,
  password: 'Password123!',
  role: 'mentor',
};

const studentUser = {
  first_name: 'Course',
  last_name: 'Student',
  email: `student_test_course_${timestamp}@example.com`,
  password: 'Password123!',
  role: 'student',
};

let mentorToken;
let otherMentorToken;
let studentToken;

let createdCourseId;
let createdResourceId;
let createdAssignmentId;

describe('Phase 3: Courses, Resources, Assignments & Enrollments Tests', () => {
  before(async () => {
    // Clean up any stale records from prior runs
    try {
      await pool.query('DELETE FROM users WHERE email LIKE "%test_course_%"');
    } catch (err) {
      console.error('Pre-test cleanup error:', err);
    }

    // Start ephemeral test server on random open port
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${server.address().port}`;
        resolve();
      });
    });

    // Helper to register and log in a user
    async function setupUser(user) {
      await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });

      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: user.password }),
      });
      const data = await res.json();
      return data.data.token;
    }

    mentorToken = await setupUser(mentorUser);
    otherMentorToken = await setupUser(otherMentorUser);
    studentToken = await setupUser(studentUser);
  });

  after(async () => {
    // Clean up all created test users (foreign keys automatically cascade deletes)
    try {
      await pool.query('DELETE FROM users WHERE email LIKE "%test_course_%"');
    } catch (err) {
      console.error('Post-test cleanup error:', err);
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await pool.end();
  });

  // 1. Course Creation & Role Protection
  describe('POST /api/courses', () => {
    it('should allow a mentor to create a course', async () => {
      const response = await fetch(`${baseUrl}/api/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mentorToken}`,
        },
        body: JSON.stringify({
          title: `Intro to Distributed Databases ${timestamp}`,
          description: 'A comprehensive study of relational models and TiDB architecture.',
        }),
      });

      const body = await response.json();
      assert.equal(response.status, 201);
      assert.equal(body.success, true);
      assert.ok(body.data.course.id);
      assert.match(body.data.course.title, /Intro to Distributed Databases/);

      createdCourseId = body.data.course.id;
    });

    it('should forbid a student from creating a course with 403 Forbidden', async () => {
      const response = await fetch(`${baseUrl}/api/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          title: 'Unauthorized Student Course',
          description: 'This should fail.',
        }),
      });

      const body = await response.json();
      assert.equal(response.status, 403);
      assert.equal(body.success, false);
      assert.match(body.message, /forbidden/i);
    });

    it('should reject course creation with missing title with 400 Bad Request', async () => {
      const response = await fetch(`${baseUrl}/api/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mentorToken}`,
        },
        body: JSON.stringify({
          description: 'Missing title',
        }),
      });

      const body = await response.json();
      assert.equal(response.status, 400);
      assert.equal(body.success, false);
      assert.ok(body.errors.some((e) => e.field === 'title'));
    });
  });

  // 2. Course Listing, Search & Pagination
  describe('GET /api/courses', () => {
    it('should return a paginated list of courses with pagination metadata', async () => {
      const response = await fetch(`${baseUrl}/api/courses?page=1&limit=5`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.equal(body.pagination.page, 1);
      assert.equal(body.pagination.limit, 5);
      assert.ok(body.pagination.total >= 1);
      assert.ok(body.pagination.totalPages >= 1);
    });

    it('should filter courses by keyword using LIKE search', async () => {
      const response = await fetch(
        `${baseUrl}/api/courses?search=Distributed%20Databases`,
        {
          headers: { Authorization: `Bearer ${studentToken}` },
        }
      );

      const body = await response.json();
      assert.equal(response.status, 200);
      assert.ok(body.data.length >= 1);
      assert.ok(body.data.some((c) => c.id === createdCourseId));
    });
  });

  // 3. Resources Management
  describe('Course Resources (/api/courses/:id/resources)', () => {
    it('should allow the course mentor to add a learning resource', async () => {
      const response = await fetch(`${baseUrl}/api/courses/${createdCourseId}/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mentorToken}`,
        },
        body: JSON.stringify({
          title: 'TiDB Cloud Quickstart',
          link_or_text: 'https://docs.pingcap.com/tidbcloud',
        }),
      });

      const body = await response.json();
      assert.equal(response.status, 201);
      assert.equal(body.success, true);
      assert.ok(body.data.resource.id);
      assert.equal(body.data.resource.title, 'TiDB Cloud Quickstart');

      createdResourceId = body.data.resource.id;
    });

    it('should forbid a non-owning mentor from adding a resource with 403 Forbidden', async () => {
      const response = await fetch(`${baseUrl}/api/courses/${createdCourseId}/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${otherMentorToken}`,
        },
        body: JSON.stringify({
          title: 'Intruder Resource',
          link_or_text: 'https://malicious.example.com',
        }),
      });

      const body = await response.json();
      assert.equal(response.status, 403);
      assert.equal(body.success, false);
      assert.match(body.message, /forbidden/i);
    });
  });

  // 4. Assignments Management
  describe('Course Assignments (/api/courses/:id/assignments)', () => {
    it('should allow the course mentor to add an assignment', async () => {
      const response = await fetch(`${baseUrl}/api/courses/${createdCourseId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mentorToken}`,
        },
        body: JSON.stringify({
          title: 'Assignment 1: Schema Optimization',
          instructions: 'Index foreign keys and test execution plans.',
          due_date: new Date(Date.now() + 86400000 * 7).toISOString(),
        }),
      });

      const body = await response.json();
      assert.equal(response.status, 201);
      assert.equal(body.success, true);
      assert.ok(body.data.assignment.id);
      assert.equal(body.data.assignment.title, 'Assignment 1: Schema Optimization');

      createdAssignmentId = body.data.assignment.id;
    });

    it('should forbid a non-owning mentor from adding an assignment with 403 Forbidden', async () => {
      const response = await fetch(`${baseUrl}/api/courses/${createdCourseId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${otherMentorToken}`,
        },
        body: JSON.stringify({
          title: 'Unauthorized Assignment',
          instructions: 'Should be rejected.',
        }),
      });

      const body = await response.json();
      assert.equal(response.status, 403);
      assert.equal(body.success, false);
    });
  });

  // 5. Course Enrollment
  describe('Course Enrollment (/api/courses/:id/enroll)', () => {
    it('should allow a student to enroll in the course', async () => {
      const response = await fetch(`${baseUrl}/api/courses/${createdCourseId}/enroll`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      const body = await response.json();
      assert.equal(response.status, 201);
      assert.equal(body.success, true);
      assert.equal(body.data.enrollment.progress_percent, 0);
      assert.equal(body.data.enrollment.course_id, createdCourseId);
    });

    it('should reject duplicate enrollment in the same course with 409 Conflict', async () => {
      const response = await fetch(`${baseUrl}/api/courses/${createdCourseId}/enroll`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      const body = await response.json();
      assert.equal(response.status, 409);
      assert.equal(body.success, false);
      assert.match(body.message, /already enrolled/i);
    });

    it('should forbid a mentor from enrolling in a course with 403 Forbidden', async () => {
      const response = await fetch(`${baseUrl}/api/courses/${createdCourseId}/enroll`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${mentorToken}` },
      });

      const body = await response.json();
      assert.equal(response.status, 403);
      assert.equal(body.success, false);
    });

    it('should return enrolled courses for the logged-in student', async () => {
      const response = await fetch(`${baseUrl}/api/courses/enrolled/me`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      const body = await response.json();
      assert.equal(response.status, 200);
      assert.ok(body.data.some((c) => c.id === createdCourseId));
    });
  });

  // 6. Detailed Course View with Resources and Enrollment Flag
  describe('GET /api/courses/:id', () => {
    it('should return complete course details with resources, assignments, and enrollment status', async () => {
      const response = await fetch(`${baseUrl}/api/courses/${createdCourseId}`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.success, true);
      assert.equal(body.data.course.id, createdCourseId);
      assert.equal(body.data.course.is_enrolled, true);
      assert.equal(body.data.course.progress_percent, 0);
      assert.equal(body.data.course.resources.length, 1);
      assert.equal(body.data.course.assignments.length, 1);
    });
  });

  // 7. Mentor Viewing Enrolled Students
  describe('GET /api/courses/:id/students', () => {
    it('should allow the course mentor to view enrolled students', async () => {
      const response = await fetch(`${baseUrl}/api/courses/${createdCourseId}/students`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });

      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data.students));
      assert.ok(body.data.students.some((s) => s.email === studentUser.email));
    });

    it('should forbid another mentor from viewing students of this course with 403 Forbidden', async () => {
      const response = await fetch(`${baseUrl}/api/courses/${createdCourseId}/students`, {
        headers: { Authorization: `Bearer ${otherMentorToken}` },
      });

      const body = await response.json();
      assert.equal(response.status, 403);
      assert.equal(body.success, false);
    });
  });

  // 8. Update and Cleanup of Resources, Assignments, and Course
  describe('Course Updates and Deletion', () => {
    it('should allow owning mentor to update course details', async () => {
      const response = await fetch(`${baseUrl}/api/courses/${createdCourseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mentorToken}`,
        },
        body: JSON.stringify({
          title: `Updated Title ${timestamp}`,
          description: 'Updated course description.',
        }),
      });

      const body = await response.json();
      assert.equal(response.status, 200);
      assert.match(body.data.course.title, /Updated Title/);
    });

    it('should allow owning mentor to delete a resource', async () => {
      const response = await fetch(
        `${baseUrl}/api/courses/${createdCourseId}/resources/${createdResourceId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${mentorToken}` },
        }
      );

      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.success, true);
    });

    it('should allow owning mentor to delete an assignment', async () => {
      const response = await fetch(
        `${baseUrl}/api/courses/${createdCourseId}/assignments/${createdAssignmentId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${mentorToken}` },
        }
      );

      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.success, true);
    });

    it('should forbid non-owning mentor from deleting the course with 403 Forbidden', async () => {
      const response = await fetch(`${baseUrl}/api/courses/${createdCourseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${otherMentorToken}` },
      });

      const body = await response.json();
      assert.equal(response.status, 403);
      assert.equal(body.success, false);
    });

    it('should allow owning mentor to delete the course', async () => {
      const response = await fetch(`${baseUrl}/api/courses/${createdCourseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${mentorToken}` },
      });

      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.success, true);
    });
  });
});
