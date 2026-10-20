process.env.NODE_ENV = 'test';

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import pool from '../src/config/db.js';
import { requireRole, authenticateToken } from '../src/middleware/auth.js';

let server;
let baseUrl;

// Ephemeral test email so tests can be run repeatedly without collision
const uniqueSuffix = Date.now();
const testStudent = {
  first_name: 'Test',
  last_name: 'Student',
  email: `student_${uniqueSuffix}@example.com`,
  password: 'Password123!',
  role: 'student',
};

const testMentor = {
  first_name: 'Test',
  last_name: 'Mentor',
  email: `mentor_${uniqueSuffix}@example.com`,
  password: 'Password123!',
  role: 'mentor',
};

describe('Phase 2: Authentication & Authorization Tests', () => {
  before(async () => {
    // Start test server on random open port (port 0)
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    // Clean up created test users from the database
    try {
      await pool.query('DELETE FROM users WHERE email IN (?, ?)', [
        testStudent.email,
        testMentor.email,
      ]);
    } catch (err) {
      console.error('Error cleaning up test users:', err);
    }

    // Close server and database pool
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // 1. Registration tests
  describe('POST /api/auth/register', () => {
    it('should register a new student user and return 201 with JWT', async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testStudent),
      });

      const body = await response.json();
      assert.equal(response.status, 201);
      assert.equal(body.success, true);
      assert.ok(body.data.token, 'Token must be present in response');
      assert.equal(body.data.user.email, testStudent.email);
      assert.equal(body.data.user.role, 'student');
      assert.equal(body.data.user.password_hash, undefined, 'password_hash must not be exposed');
    });

    it('should register a mentor user when explicit role is supplied', async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testMentor),
      });

      const body = await response.json();
      assert.equal(response.status, 201);
      assert.equal(body.success, true);
      assert.equal(body.data.user.role, 'mentor');
    });

    it('should reject registration with duplicate email with 409 Conflict', async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testStudent),
      });

      const body = await response.json();
      assert.equal(response.status, 409);
      assert.equal(body.success, false);
      assert.match(body.message, /already exists/i);
    });

    it('should reject registration with password shorter than 6 characters with 400 Bad Request', async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: 'Short',
          last_name: 'Pass',
          email: 'shortpass@example.com',
          password: '123',
        }),
      });

      const body = await response.json();
      assert.equal(response.status, 400);
      assert.equal(body.success, false);
      assert.ok(Array.isArray(body.errors));
      assert.ok(body.errors.some((e) => e.field === 'password'));
    });

    it('should reject registration with invalid email format with 400 Bad Request', async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: 'Invalid',
          last_name: 'Email',
          email: 'not-an-email',
          password: 'Password123!',
        }),
      });

      const body = await response.json();
      assert.equal(response.status, 400);
      assert.equal(body.success, false);
      assert.ok(body.errors.some((e) => e.field === 'email'));
    });
  });

  // 2. Login tests
  describe('POST /api/auth/login', () => {
    it('should log in successfully with valid credentials and return JWT', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testStudent.email,
          password: testStudent.password,
        }),
      });

      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.success, true);
      assert.ok(body.data.token, 'Token should be returned');
      assert.equal(body.data.user.email, testStudent.email);
    });

    it('should reject login with wrong password with 401 Unauthorized', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testStudent.email,
          password: 'WrongPassword!',
        }),
      });

      const body = await response.json();
      assert.equal(response.status, 401);
      assert.equal(body.success, false);
      assert.match(body.message, /invalid email or password/i);
    });

    it('should reject login for non-existent email with 401 Unauthorized', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent_user_xyz@example.com',
          password: 'Password123!',
        }),
      });

      const body = await response.json();
      assert.equal(response.status, 401);
      assert.equal(body.success, false);
      assert.match(body.message, /invalid email or password/i);
    });
  });

  // 3. User profile tests (/api/auth/me)
  describe('GET /api/auth/me', () => {
    let studentToken;

    before(async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testStudent.email,
          password: testStudent.password,
        }),
      });
      const body = await response.json();
      studentToken = body.data.token;
    });

    it('should return current user profile when valid Bearer token is provided', async () => {
      const response = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.success, true);
      assert.equal(body.data.user.email, testStudent.email);
      assert.equal(body.data.user.role, 'student');
      assert.equal(body.data.user.password_hash, undefined);
    });

    it('should reject request when Authorization header is missing with 401 Unauthorized', async () => {
      const response = await fetch(`${baseUrl}/api/auth/me`);
      const body = await response.json();
      assert.equal(response.status, 401);
      assert.equal(body.success, false);
    });

    it('should reject request when token is invalid or malformed with 401 Unauthorized', async () => {
      const response = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: 'Bearer this.is.an.invalid.token' },
      });
      const body = await response.json();
      assert.equal(response.status, 401);
      assert.equal(body.success, false);
    });
  });

  // 4. Role-based authorization tests
  describe('Role-Based Authorization Middleware', () => {
    let studentToken;
    let mentorToken;

    before(async () => {
      // Login as student
      const studentRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testStudent.email,
          password: testStudent.password,
        }),
      });
      const studentBody = await studentRes.json();
      studentToken = studentBody.data.token;

      // Login as mentor
      const mentorRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testMentor.email,
          password: testMentor.password,
        }),
      });
      const mentorBody = await mentorRes.json();
      mentorToken = mentorBody.data.token;
    });

    it('should deny student access to mentor-only route with 403 Forbidden', async () => {
      const response = await fetch(`${baseUrl}/api/auth/role-check`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      const body = await response.json();
      assert.equal(response.status, 403);
      assert.equal(body.success, false);
      assert.match(body.message, /forbidden/i);
    });

    it('should allow mentor access to mentor-only route with 200 OK', async () => {
      const response = await fetch(`${baseUrl}/api/auth/role-check`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });

      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.success, true);
      assert.match(body.message, /access granted/i);
    });
  });
});
