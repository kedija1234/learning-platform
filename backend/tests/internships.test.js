/**
 * Phase 5 - Internships & Applications Test Suite
 *
 * Covers:
 *  - Coordinator creates internship opportunity (201)
 *  - Student forbidden from creating internship (403)
 *  - Mentor forbidden from creating internship (403)
 *  - Missing required fields rejected with 400 Bad Request
 *  - Browse internships with pagination (200)
 *  - Filter internships by keyword using LIKE search (200)
 *  - Retrieve single internship details by ID (200)
 *  - Student applies for internship (201)
 *  - Coordinator receives notification when student applies (DB check)
 *  - Duplicate application rejected with 409 Conflict
 *  - Coordinator forbidden from applying (403)
 *  - Student cannot apply if deadline has passed (400)
 *  - Student views their own applications history (200)
 *  - Owning coordinator views applicants list (200)
 *  - Non-owning coordinator forbidden from viewing applicants (403)
 *  - Owning coordinator accepts an applicant (200)
 *  - Student receives notification when application is accepted (DB check)
 *  - Owning coordinator rejects an applicant (200)
 *  - Student receives notification when application is rejected (DB check)
 *  - Non-owning coordinator forbidden from updating applicant status (403)
 *  - Invalid status value rejected with 400 Bad Request
 *  - Owning coordinator updates internship posting (200)
 *  - Non-owning coordinator forbidden from updating posting (403)
 *  - Non-owning coordinator forbidden from deleting posting (403)
 *  - Owning coordinator deletes internship posting (200)
 */

process.env.NODE_ENV = 'test';

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import pool from '../src/config/db.js';

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

let coordinatorToken, otherCoordinatorToken, studentToken, student2Token, mentorToken;
let coordinatorId, otherCoordinatorId, studentId, student2Id;
let internshipId, expiredInternshipId, applicationId;

const TAG = 'test_intern_';

// ---------- setup / teardown -------------------------------------------------

async function cleanUp() {
  await pool.query(
    `DELETE n FROM notifications n
       JOIN users u ON n.user_id = u.id
      WHERE u.email LIKE ?`,
    [`%${TAG}%`]
  );
  await pool.query(
    `DELETE a FROM applications a
       JOIN internships i ON a.internship_id = i.id
      WHERE i.title LIKE ?`,
    [`%${TAG}%`]
  );
  await pool.query('DELETE FROM internships WHERE title LIKE ?', [`%${TAG}%`]);
  await pool.query('DELETE FROM users WHERE email LIKE ?', [`%${TAG}%`]);
}

describe('Phase 5: Internships & Applications Tests', () => {

  before(async () => {
    await cleanUp();

    // Start ephemeral server on random port
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${server.address().port}/api`;
        resolve();
      });
    });

    // 1. Register owning coordinator
    const c1 = await api('POST', '/auth/register', {
      first_name: 'Lead',
      last_name: 'Coordinator',
      email: `${TAG}coord1@example.com`,
      password: 'Password123!',
      role: 'coordinator',
    });
    coordinatorToken = c1.body.data?.token;
    coordinatorId = c1.body.data?.user?.id;

    // 2. Register other coordinator (non-owner)
    const c2 = await api('POST', '/auth/register', {
      first_name: 'Other',
      last_name: 'Coordinator',
      email: `${TAG}coord2@example.com`,
      password: 'Password123!',
      role: 'coordinator',
    });
    otherCoordinatorToken = c2.body.data?.token;
    otherCoordinatorId = c2.body.data?.user?.id;

    // 3. Register student 1
    const s1 = await api('POST', '/auth/register', {
      first_name: 'Alex',
      last_name: 'Student',
      email: `${TAG}student1@example.com`,
      password: 'Password123!',
      role: 'student',
    });
    studentToken = s1.body.data?.token;
    studentId = s1.body.data?.user?.id;

    // 4. Register student 2
    const s2 = await api('POST', '/auth/register', {
      first_name: 'Sam',
      last_name: 'Student2',
      email: `${TAG}student2@example.com`,
      password: 'Password123!',
      role: 'student',
    });
    student2Token = s2.body.data?.token;
    student2Id = s2.body.data?.user?.id;

    // 5. Register a mentor
    const m = await api('POST', '/auth/register', {
      first_name: 'Mentor',
      last_name: 'User',
      email: `${TAG}mentor@example.com`,
      password: 'Password123!',
      role: 'mentor',
    });
    mentorToken = m.body.data?.token;
  });

  after(async () => {
    await cleanUp();
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await pool.end();
  });

  // ---------- 1. Internship Posting & Permissions ----------------------------

  it('coordinator can post a new internship opportunity (201)', async () => {
    const { status, body } = await api(
      'POST',
      '/internships',
      {
        title: `${TAG}Software Engineering Intern`,
        organization_name: 'Tech Innovators Ltd',
        description: 'Build backend microservices and databases.',
        deadline: '2030-06-30T23:59:59.000Z',
      },
      coordinatorToken
    );

    assert.equal(status, 201, JSON.stringify(body));
    assert.ok(body.data?.internship?.id);
    assert.equal(body.data.internship.coordinator_id, coordinatorId);
    internshipId = body.data.internship.id;
  });

  it('student is forbidden from posting an internship (403)', async () => {
    const { status } = await api(
      'POST',
      '/internships',
      {
        title: `${TAG}Hacker Intern`,
        organization_name: 'Unauthorized Corp',
        description: 'Should be rejected.',
      },
      studentToken
    );
    assert.equal(status, 403);
  });

  it('mentor is forbidden from posting an internship (403)', async () => {
    const { status } = await api(
      'POST',
      '/internships',
      {
        title: `${TAG}Mentor Posted Intern`,
        organization_name: 'Unauthorized Corp',
        description: 'Should be rejected.',
      },
      mentorToken
    );
    assert.equal(status, 403);
  });

  it('posting with missing title is rejected with 400 Bad Request', async () => {
    const { status, body } = await api(
      'POST',
      '/internships',
      {
        organization_name: 'Acme Corp',
        description: 'Missing title in body.',
      },
      coordinatorToken
    );
    assert.equal(status, 400, JSON.stringify(body));
  });

  // ---------- 2. Browsing & Searching ----------------------------------------

  it('can list internships with pagination metadata (200)', async () => {
    const { status, body } = await api('GET', '/internships?page=1&limit=5', null, studentToken);
    assert.equal(status, 200, JSON.stringify(body));
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1);
    assert.ok(body.pagination?.total >= 1);
  });

  it('filters internships by keyword search using LIKE (200)', async () => {
    const { status, body } = await api('GET', `/internships?search=Innovators`, null, studentToken);
    assert.equal(status, 200, JSON.stringify(body));
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.some((item) => item.organization_name === 'Tech Innovators Ltd'));
  });

  it('retrieves detailed internship record by ID (200)', async () => {
    const { status, body } = await api('GET', `/internships/${internshipId}`, null, studentToken);
    assert.equal(status, 200, JSON.stringify(body));
    assert.equal(body.data?.internship?.id, internshipId);
    assert.equal(body.data?.internship?.organization_name, 'Tech Innovators Ltd');
  });

  // ---------- 3. Applications ------------------------------------------------

  it('student can apply for an internship (201)', async () => {
    const { status, body } = await api(
      'POST',
      `/internships/${internshipId}/apply`,
      null,
      studentToken
    );
    assert.equal(status, 201, JSON.stringify(body));
    assert.ok(body.data?.application?.id);
    assert.equal(body.data.application.status, 'pending');
    applicationId = body.data.application.id;
  });

  it('coordinator receives notification when a student applies', async () => {
    const [rows] = await pool.query(
      `SELECT id, type, message FROM notifications WHERE user_id = ? AND type = 'application_received' ORDER BY id DESC`,
      [coordinatorId]
    );
    assert.ok(rows.length >= 1, 'notification must be created for coordinator');
    assert.ok(rows[0].message.includes('Alex Student'));
  });

  it('duplicate application by same student is rejected with 409 Conflict', async () => {
    const { status, body } = await api(
      'POST',
      `/internships/${internshipId}/apply`,
      null,
      studentToken
    );
    assert.equal(status, 409, JSON.stringify(body));
  });

  it('coordinator is forbidden from applying for an internship (403)', async () => {
    const { status } = await api(
      'POST',
      `/internships/${internshipId}/apply`,
      null,
      coordinatorToken
    );
    assert.equal(status, 403);
  });

  it('student cannot apply if deadline has passed (400)', async () => {
    // Create an expired internship directly
    const [result] = await pool.query(
      `INSERT INTO internships (coordinator_id, title, organization_name, description, deadline)
       VALUES (?, ?, ?, ?, '2020-01-01 00:00:00')`,
      [coordinatorId, `${TAG}Expired Role`, 'Past Inc', 'An old expired role.']
    );
    expiredInternshipId = result.insertId;

    const { status, body } = await api(
      'POST',
      `/internships/${expiredInternshipId}/apply`,
      null,
      student2Token
    );
    assert.equal(status, 400, JSON.stringify(body));
    assert.ok(body.message.includes('deadline'));
  });

  it('student can view their submitted applications history (200)', async () => {
    const { status, body } = await api(
      'GET',
      '/internships/applications/me',
      null,
      studentToken
    );
    assert.equal(status, 200, JSON.stringify(body));
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1);
    assert.equal(body.data[0].internship_id, internshipId);
  });

  // ---------- 4. Coordinator Application Review & Decision -------------------

  it('non-owning coordinator cannot view applicants for the internship (403)', async () => {
    const { status } = await api(
      'GET',
      `/internships/${internshipId}/applications`,
      null,
      otherCoordinatorToken
    );
    assert.equal(status, 403);
  });

  it('owning coordinator can view all applicants for their internship (200)', async () => {
    const { status, body } = await api(
      'GET',
      `/internships/${internshipId}/applications`,
      null,
      coordinatorToken
    );
    assert.equal(status, 200, JSON.stringify(body));
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1);
    assert.equal(body.data[0].id, applicationId);
  });

  it('non-owning coordinator cannot update applicant status (403)', async () => {
    const { status } = await api(
      'PUT',
      `/internships/${internshipId}/applications/${applicationId}/status`,
      { status: 'accepted' },
      otherCoordinatorToken
    );
    assert.equal(status, 403);
  });

  it('invalid status value is rejected with 400 Bad Request', async () => {
    const { status, body } = await api(
      'PUT',
      `/internships/${internshipId}/applications/${applicationId}/status`,
      { status: 'maybe_hire' },
      coordinatorToken
    );
    assert.equal(status, 400, JSON.stringify(body));
  });

  it('owning coordinator accepts an applicant (200)', async () => {
    const { status, body } = await api(
      'PUT',
      `/internships/${internshipId}/applications/${applicationId}/status`,
      { status: 'accepted' },
      coordinatorToken
    );
    assert.equal(status, 200, JSON.stringify(body));
    assert.equal(body.data?.application?.status, 'accepted');
  });

  it('student receives notification when application is accepted', async () => {
    const [rows] = await pool.query(
      `SELECT id, type, message FROM notifications WHERE user_id = ? AND type = 'application_status_updated' ORDER BY id DESC`,
      [studentId]
    );
    assert.ok(rows.length >= 1, 'notification must be created for student');
    assert.ok(rows[0].message.includes('accepted'));
  });

  it('owning coordinator can update application status to rejected (200)', async () => {
    // Have student 2 apply so we can test rejection
    const applyRes = await api(
      'POST',
      `/internships/${internshipId}/apply`,
      null,
      student2Token
    );
    const s2AppId = applyRes.body.data.application.id;

    const { status, body } = await api(
      'PUT',
      `/internships/${internshipId}/applications/${s2AppId}/status`,
      { status: 'rejected' },
      coordinatorToken
    );
    assert.equal(status, 200, JSON.stringify(body));
    assert.equal(body.data?.application?.status, 'rejected');

    // Verify student 2 receives notification
    const [rows] = await pool.query(
      `SELECT id, type, message FROM notifications WHERE user_id = ? AND type = 'application_status_updated' ORDER BY id DESC`,
      [student2Id]
    );
    assert.ok(rows.length >= 1);
    assert.ok(rows[0].message.includes('rejected'));
  });

  // ---------- 5. Updates & Deletion ------------------------------------------

  it('non-owning coordinator cannot update internship (403)', async () => {
    const { status } = await api(
      'PUT',
      `/internships/${internshipId}`,
      { title: 'Hijacked Title' },
      otherCoordinatorToken
    );
    assert.equal(status, 403);
  });

  it('owning coordinator can update internship details (200)', async () => {
    const { status, body } = await api(
      'PUT',
      `/internships/${internshipId}`,
      {
        title: `${TAG}Senior Backend Engineering Intern`,
        description: 'Updated description with microservices and Redis.',
      },
      coordinatorToken
    );
    assert.equal(status, 200, JSON.stringify(body));
    assert.ok(body.data?.internship?.title.includes('Senior'));
  });

  it('non-owning coordinator cannot delete internship (403)', async () => {
    const { status } = await api(
      'DELETE',
      `/internships/${internshipId}`,
      null,
      otherCoordinatorToken
    );
    assert.equal(status, 403);
  });

  it('owning coordinator can delete internship (200)', async () => {
    const { status, body } = await api(
      'DELETE',
      `/internships/${internshipId}`,
      null,
      coordinatorToken
    );
    assert.equal(status, 200, JSON.stringify(body));

    // Confirm it returns 404 now
    const check = await api('GET', `/internships/${internshipId}`, null, studentToken);
    assert.equal(check.status, 404);
  });

});
