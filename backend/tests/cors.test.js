process.env.NODE_ENV = 'test';

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import pool from '../src/config/db.js';

let server;
let baseUrl;

describe('Phase 8 Step 3: CORS Restriction Tests', () => {
  before(async () => {
    // Start ephemeral server
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${server.address().port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    // Close database pool so the event loop can terminate
    await pool.end();
    // Reset any temporary env changes
    delete process.env.FRONTEND_URL;
    process.env.NODE_ENV = 'test';
  });

  it('allows requests with Origin: http://localhost:5173 during development/test', async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'http://localhost:5173' },
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  });

  it('allows requests with Origin: http://localhost:5174 during development/test', async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'http://localhost:5174' },
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5174');
  });

  it('handles preflight OPTIONS requests for allowed development origin', async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      },
    });
    assert.ok(res.status === 204 || res.status === 200);
    assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  });

  it('rejects unauthorized origin with 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://unauthorized-attacker.example.com' },
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /CORS policy violation/i);
    assert.notEqual(
      res.headers.get('access-control-allow-origin'),
      'https://unauthorized-attacker.example.com'
    );
  });

  it('rejects preflight OPTIONS from unauthorized origin with 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://unauthorized-attacker.example.com',
        'Access-Control-Request-Method': 'POST',
      },
    });
    assert.equal(res.status, 403);
  });

  it('allows requests without an Origin header (e.g. server-to-server, curl, mobile)', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
  });

  it('allows origins configured in FRONTEND_URL environment variable (single URL)', async () => {
    process.env.FRONTEND_URL = 'https://unilink-production.vercel.app';

    const res = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://unilink-production.vercel.app' },
    });
    assert.equal(res.status, 200);
    assert.equal(
      res.headers.get('access-control-allow-origin'),
      'https://unilink-production.vercel.app'
    );
  });

  it('allows multiple comma-separated origins configured in FRONTEND_URL', async () => {
    process.env.FRONTEND_URL =
      'https://first-app.vercel.app, https://second-app.university.edu, https://third-app.com/';

    const res1 = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://first-app.vercel.app' },
    });
    assert.equal(res1.status, 200);
    assert.equal(res1.headers.get('access-control-allow-origin'), 'https://first-app.vercel.app');

    const res2 = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://second-app.university.edu' },
    });
    assert.equal(res2.status, 200);
    assert.equal(
      res2.headers.get('access-control-allow-origin'),
      'https://second-app.university.edu'
    );

    // Strips trailing slash appropriately
    const res3 = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://third-app.com' },
    });
    assert.equal(res3.status, 200);
  });

  it('rejects localhost origins when NODE_ENV is production and FRONTEND_URL does not include localhost', async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'https://prod-domain.com';

    try {
      const res = await fetch(`${baseUrl}/api/health`, {
        headers: { Origin: 'http://localhost:5173' },
      });
      assert.equal(res.status, 403);

      const resAllowed = await fetch(`${baseUrl}/api/health`, {
        headers: { Origin: 'https://prod-domain.com' },
      });
      assert.equal(resAllowed.status, 200);
      assert.equal(resAllowed.headers.get('access-control-allow-origin'), 'https://prod-domain.com');
    } finally {
      process.env.NODE_ENV = origEnv;
      delete process.env.FRONTEND_URL;
    }
  });
});
