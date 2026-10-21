/**
 * Phase 6 - Notifications API Test Suite
 *
 * Covers:
 *  - Unauthenticated access rejected with 401 Unauthorized
 *  - Initial unread count is 0 for newly registered user (200)
 *  - When coordinator posts an internship, all active students receive a broadcast notification
 *  - Student unread count increments after receiving a notification (200)
 *  - Student lists notifications with pagination metadata (200)
 *  - Student filters notifications with unreadOnly=true (200)
 *  - Strict isolation: Student 2 cannot see Student 1''s notifications (isolated list)
 *  - Student marks one of their notifications as read (200)
 *  - Strict isolation: Student 2 cannot mark Student 1''s notification as read (403 Forbidden)
 *  - Marking non-existent notification returns 404 Not Found
 *  - Marking with non-numeric ID returns 400 Bad Request
 *  - Student marks all notifications as read (200)
 *  - Unread count drops to 0 after marking all as read (200)
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

let student1Token, student2Token, coordinatorToken;
let student1Id, student2Id, coordinatorId;
let student1NotificationId;

const TAG = 'test_notif_';

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
       JOIN users u ON a.student_id = u.id
      WHERE u.email LIKE ?`,
    [`%${TAG}%`]
  );
  await pool.query(
    `DELETE i FROM internships i
       JOIN users u ON i.coordinator_id = u.id
      WHERE u.email LIKE ?`,
    [`%${TAG}%`]
  );
  await pool.query('DELETE FROM users WHERE email LIKE ?', [`%${TAG}%`]);
}

describe('Phase 6: Notifications API Tests', () => {

  before(async () => {
    await cleanUp();

    // Start ephemeral server on random port
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${server.address().port}/api`;
        resolve();
      });
    });

    // 1. Register student 1
    const s1 = await api('POST', '/auth/register', {
      first_name: 'Notif',
      last_name: 'StudentOne',
      email: `${TAG}student1@example.com`,
      password: 'Password123!',
      role: 'student',
    });
    student1Token = s1.body.data?.token;
    student1Id = s1.body.data?.user?.id;

    // 2. Register student 2 (used for cross-user isolation tests)
    const s2 = await api('POST', '/auth/register', {
      first_name: 'Notif',
      last_name: 'StudentTwo',
      email: `${TAG}student2@example.com`,
      password: 'Password123!',
      role: 'student',
    });
    student2Token = s2.body.data?.token;
    student2Id = s2.body.data?.user?.id;

    // 3. Register coordinator
    const c = await api('POST', '/auth/register', {
      first_name: 'Notif',
      last_name: 'Coordinator',
      email: `${TAG}coord@example.com`,
      password: 'Password123!',
      role: 'coordinator',
    });
    coordinatorToken = c.body.data?.token;
    coordinatorId = c.body.data?.user?.id;
  });

  after(async () => {
    await cleanUp();
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await pool.end();
  });

  // ---------- 1. Authentication & Initial State ------------------------------

  it('unauthenticated request to notifications is rejected with 401 Unauthorized', async () => {
    const { status } = await api('GET', '/notifications', null, null);
    assert.equal(status, 401);
  });

  it('newly registered student has 0 unread notifications (200)', async () => {
    const { status, body } = await api('GET', '/notifications/unread-count', null, student1Token);
    assert.equal(status, 200, JSON.stringify(body));
    assert.equal(body.data?.unread_count, 0);
  });

  // ---------- 2. Internship Broadcast Notification ---------------------------

  it('when coordinator posts an internship, students receive broadcast notification', async () => {
    const { status, body } = await api(
      'POST',
      '/internships',
      {
        title: `${TAG}Cloud Infrastructure Intern`,
        organization_name: 'Serverless Global',
        description: 'Design and deploy modern distributed microservices.',
        deadline: '2030-08-31T23:59:59.000Z',
      },
      coordinatorToken
    );
    assert.equal(status, 201, JSON.stringify(body));

    // Both student 1 and student 2 should have received a notification
    const [rows1] = await pool.query(
      'SELECT id, type, message FROM notifications WHERE user_id = ? AND type = "new_internship_posted"',
      [student1Id]
    );
    assert.ok(rows1.length >= 1, 'Student 1 must receive broadcast notification');
    student1NotificationId = rows1[0].id;

    const [rows2] = await pool.query(
      'SELECT id, type, message FROM notifications WHERE user_id = ? AND type = "new_internship_posted"',
      [student2Id]
    );
    assert.ok(rows2.length >= 1, 'Student 2 must receive broadcast notification');
  });

  it('student unread count increments after receiving broadcast notification (200)', async () => {
    const { status, body } = await api('GET', '/notifications/unread-count', null, student1Token);
    assert.equal(status, 200, JSON.stringify(body));
    assert.ok(body.data?.unread_count >= 1);
  });

  // ---------- 3. Listing & Pagination ----------------------------------------

  it('student lists notifications with pagination metadata (200)', async () => {
    const { status, body } = await api('GET', '/notifications?page=1&limit=10', null, student1Token);
    assert.equal(status, 200, JSON.stringify(body));
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1);
    assert.ok(body.pagination?.total >= 1);
    assert.equal(body.pagination?.page, 1);
    assert.equal(body.pagination?.limit, 10);
  });

  it('student filters unread notifications using unreadOnly=true (200)', async () => {
    const { status, body } = await api('GET', '/notifications?unreadOnly=true', null, student1Token);
    assert.equal(status, 200, JSON.stringify(body));
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.every((n) => n.is_read === 0 || n.is_read === false));
  });

  it('invalid pagination limit is rejected with 400 Bad Request', async () => {
    const { status } = await api('GET', '/notifications?limit=500', null, student1Token);
    assert.equal(status, 400);
  });

  // ---------- 4. User Isolation (Seeing Only Own Notifications) --------------

  it('strict isolation: student only sees their own notifications, not others', async () => {
    // Insert an isolated notification specifically for student 2
    await pool.query(
      'INSERT INTO notifications (user_id, type, message) VALUES (?, "private_test", "Exclusive to Student 2")',
      [student2Id]
    );

    const s1Res = await api('GET', '/notifications', null, student1Token);
    assert.equal(s1Res.status, 200);
    // Student 1 must NOT see Student 2's notification
    assert.ok(!s1Res.body.data.some((n) => n.message === 'Exclusive to Student 2'));

    const s2Res = await api('GET', '/notifications', null, student2Token);
    assert.equal(s2Res.status, 200);
    // Student 2 MUST see their notification
    assert.ok(s2Res.body.data.some((n) => n.message === 'Exclusive to Student 2'));
  });

  // ---------- 5. Marking Notifications as Read -------------------------------

  it("strict isolation: student cannot mark another student's notification as read (403)", async () => {
    // Student 2 attempts to mark Student 1's notification as read
    const { status } = await api(
      'PUT',
      `/notifications/${student1NotificationId}/read`,
      null,
      student2Token
    );
    assert.equal(status, 403);
  });

  it('marking non-existent notification returns 404 Not Found', async () => {
    const { status } = await api('PUT', '/notifications/9999999/read', null, student1Token);
    assert.equal(status, 404);
  });

  it('marking with invalid non-numeric ID returns 400 Bad Request', async () => {
    const { status } = await api('PUT', '/notifications/abc/read', null, student1Token);
    assert.equal(status, 400);
  });

  it('student marks their own notification as read (200)', async () => {
    const { status, body } = await api(
      'PUT',
      `/notifications/${student1NotificationId}/read`,
      null,
      student1Token
    );
    assert.equal(status, 200, JSON.stringify(body));
    assert.equal(body.data?.notification?.id, student1NotificationId);

    // Verify in database that is_read is 1
    const [rows] = await pool.query('SELECT is_read FROM notifications WHERE id = ?', [student1NotificationId]);
    assert.equal(rows[0].is_read, 1);
  });

  it('marking an already read notification succeeds idempotently (200)', async () => {
    const { status, body } = await api(
      'PATCH',
      `/notifications/${student1NotificationId}/read`,
      null,
      student1Token
    );
    assert.equal(status, 200, JSON.stringify(body));
  });

  it('student marks all unread notifications as read (200)', async () => {
    // Add two more unread notifications for student 1
    await pool.query(
      `INSERT INTO notifications (user_id, type, message) VALUES
       (?, 'test_batch_1', 'Batch unread 1'),
       (?, 'test_batch_2', 'Batch unread 2')`,
      [student1Id, student1Id]
    );

    const { status, body } = await api('PUT', '/notifications/read-all', null, student1Token);
    assert.equal(status, 200, JSON.stringify(body));
    assert.ok(body.data?.updated_count >= 2);
  });

  it('unread count becomes 0 after marking all as read (200)', async () => {
    const { status, body } = await api('GET', '/notifications/unread-count', null, student1Token);
    assert.equal(status, 200, JSON.stringify(body));
    assert.equal(body.data?.unread_count, 0);
  });

});
