process.env.NODE_ENV = 'test';

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import pool from '../src/config/db.js';

let server;
let baseUrl;

const timestamp = Date.now();

const adminUser = {
  first_name: 'Admin',
  last_name: 'Tester',
  email: `admin_test_phase8_${timestamp}@example.com`,
  password: 'Password123!',
  role: 'admin',
};

const studentUser = {
  first_name: 'Student',
  last_name: 'Tester',
  email: `student_test_phase8_${timestamp}@example.com`,
  password: 'Password123!',
  role: 'student',
};

const mentorUser = {
  first_name: 'Mentor',
  last_name: 'Tester',
  email: `mentor_test_phase8_${timestamp}@example.com`,
  password: 'Password123!',
  role: 'mentor',
};

const coordinatorUser = {
  first_name: 'Coord',
  last_name: 'Tester',
  email: `coord_test_phase8_${timestamp}@example.com`,
  password: 'Password123!',
  role: 'coordinator',
};

let adminToken;
let adminId;
let studentToken;
let studentId;
let mentorToken;
let coordinatorToken;

describe('Phase 8 Step 1: Admin Backend Routes & Security Tests', () => {
  before(async () => {
    // Ephemeral server
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${server.address().port}`;
        resolve();
      });
    });

    // Helper: Register accounts
    async function registerUser(userData) {
      // Direct registration for student, mentor, coordinator
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      return data;
    }

    const regStudent = await registerUser(studentUser);
    studentToken = regStudent.data?.token;
    studentId = regStudent.data?.user?.id;

    const regMentor = await registerUser(mentorUser);
    mentorToken = regMentor.data?.token;

    const regCoord = await registerUser(coordinatorUser);
    coordinatorToken = regCoord.data?.token;

    // Register admin user directly via DB insertion (since register route forbids admin)
    const bcrypt = (await import('bcryptjs')).default;
    const hashed = await bcrypt.hash(adminUser.password, 10);
    const [adminInsert] = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, 'admin', TRUE)`,
      [adminUser.first_name, adminUser.last_name, adminUser.email, hashed]
    );
    adminId = adminInsert.insertId;

    // Log in as admin to retrieve valid JWT
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminUser.email, password: adminUser.password }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.data?.token;
  });

  after(async () => {
    try {
      await pool.query('DELETE FROM users WHERE email LIKE "%test_phase8_%"');
    } catch (err) {
      console.error('Post-test cleanup error:', err);
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await pool.end();
  });

  it('unauthenticated request to /api/admin/users is rejected (401)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users`);
    assert.equal(res.status, 401);
  });

  it('unauthenticated request to /api/admin/stats is rejected (401)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/stats`);
    assert.equal(res.status, 401);
  });

  it('student is forbidden from accessing /api/admin/users (403)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.equal(res.status, 403);
  });

  it('mentor is forbidden from accessing /api/admin/users (403)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${mentorToken}` },
    });
    assert.equal(res.status, 403);
  });

  it('coordinator is forbidden from accessing /api/admin/users (403)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${coordinatorToken}` },
    });
    assert.equal(res.status, 403);
  });

  it('student is forbidden from accessing /api/admin/stats (403)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.equal(res.status, 403);
  });

  it('admin can list users with pagination metadata (200)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.pagination);
    assert.ok(body.pagination.total >= 4);
    assert.equal(body.pagination.page, 1);
  });

  it('admin can filter users by role (200)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users?role=student`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data.every((u) => u.role === 'student'));
  });

  it('admin can search users by keyword (200)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users?search=student_test_phase8`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data.some((u) => u.email === studentUser.email));
  });

  it('admin can deactivate a student account (200)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users/${studentId}/status`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_active: false }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data?.user?.is_active, false);

    // Verify deactivated user cannot log in
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentUser.email, password: studentUser.password }),
    });
    assert.equal(loginRes.status, 403);
  });

  it('admin can reactivate the student account (200)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users/${studentId}/status`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_active: true }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data?.user?.is_active, true);

    // Verify reactivated user can now log in
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentUser.email, password: studentUser.password }),
    });
    assert.equal(loginRes.status, 200);
  });

  it('admin cannot deactivate their own account (400)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users/${adminId}/status`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_active: false }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.message, /cannot deactivate your own/i);
  });

  it('admin can change a user role (200)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users/${studentId}/role`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'mentor' }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data?.user?.role, 'mentor');

    // Restore role back to student
    await fetch(`${baseUrl}/api/admin/users/${studentId}/role`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'student' }),
    });
  });

  it('admin cannot demote their own account from admin role (400)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users/${adminId}/role`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'student' }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.message, /cannot demote your own/i);
  });

  it('admin can retrieve platform statistics (200)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    const { stats } = body.data;
    assert.ok(stats);
    assert.ok(stats.users.total >= 4);
    assert.ok(stats.users.students >= 1);
    assert.ok(stats.users.mentors >= 1);
    assert.ok(stats.users.coordinators >= 1);
    assert.ok(stats.users.admins >= 1);
    assert.ok(typeof stats.courses.total === 'number');
    assert.ok(typeof stats.enrollments.total === 'number');
    assert.ok(typeof stats.submissions.total === 'number');
    assert.ok(typeof stats.internships.total === 'number');
    assert.ok(typeof stats.applications.total === 'number');
  });
});
