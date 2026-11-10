/**
 * AI Study Assistant API Test Suite
 *
 * Covers:
 *  - 401 without token
 *  - 400 for a too-short question (< 3 chars)
 *  - 400 for a too-long question (> 500 chars)
 *  - 200 with a mocked answer
 *  - 503 when the GEMINI_API_KEY is missing
 *  - 502 when fetch fails / times out
 *  - 429 after the rate limit (max 10 requests per minute per user)
 */

process.env.NODE_ENV = 'test';

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { resetRateLimits } from '../src/features/assistant/assistant.routes.js';

let server;
let baseUrl;
let originalFetch;

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_12345_local_testing_only';

// Helper to create test JWT tokens for different roles/users
function makeToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

const studentUser = { id: 7001, email: 'student_ai@example.com', role: 'student' };
const mentorUser = { id: 7002, email: 'mentor_ai@example.com', role: 'mentor' };
const studentToken = makeToken(studentUser);
const mentorToken = makeToken(mentorUser);

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

describe('AI Study Assistant API (/api/assistant/ask)', () => {
  before(async () => {
    originalFetch = globalThis.fetch;

    // Start ephemeral test server
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${server.address().port}/api`;
        resolve();
      });
    });
  });

  after(async () => {
    globalThis.fetch = originalFetch;
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  beforeEach(() => {
    resetRateLimits();
    // Default dummy test key for mock tests
    process.env.GEMINI_API_KEY = 'mock_test_key_xyz123';
  });

  it('1. should return 401 when request has no token', async () => {
    const res = await api('POST', '/assistant/ask', {
      question: 'What is photosynthesis?',
    });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes('token') || res.body.message.includes('Access denied'));
  });

  it('2. should return 400 for a too-short question (< 3 characters)', async () => {
    const res = await api(
      'POST',
      '/assistant/ask',
      {
        question: 'hi',
      },
      studentToken
    );

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(Array.isArray(res.body.errors));
    const questionError = res.body.errors.find((e) => e.field === 'question');
    assert.ok(questionError, 'Expected validation error on question field');
  });

  it('3. should return 400 for a too-long question (> 500 characters)', async () => {
    const longQuestion = 'A'.repeat(501);
    const res = await api(
      'POST',
      '/assistant/ask',
      {
        question: longQuestion,
      },
      studentToken
    );

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(Array.isArray(res.body.errors));
    const questionError = res.body.errors.find((e) => e.field === 'question');
    assert.ok(questionError, 'Expected validation error on question field');
  });

  it('4. should return 200 with a mocked answer from Gemini', async () => {
    const mockAnswer =
      'Photosynthesis is the process by which green plants and certain other organisms transform light energy into chemical energy.';

    // Mock fetch to simulate Gemini REST API success response
    globalThis.fetch = async (url, options) => {
      // If call is internal to the test server itself (loopback to baseUrl), use original fetch
      if (typeof url === 'string' && url.includes('localhost')) {
        return originalFetch(url, options);
      }

      // Assert that Gemini API endpoint is called
      assert.ok(url.includes('generativelanguage.googleapis.com'));
      assert.ok(url.includes('generateContent'));
      assert.equal(options.method, 'POST');

      const parsedBody = JSON.parse(options.body);
      assert.equal(parsedBody.contents[0].parts[0].text, 'What is photosynthesis?');
      assert.ok(parsedBody.system_instruction.parts[0].text.includes('study helper for university students'));

      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: mockAnswer,
                  },
                ],
                role: 'model',
              },
              finishReason: 'STOP',
            },
          ],
        }),
      };
    };

    const res = await api(
      'POST',
      '/assistant/ask',
      {
        question: 'What is photosynthesis?',
      },
      studentToken
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data?.answer, mockAnswer);
  });

  it('5. should return 503 when GEMINI_API_KEY is missing or empty', async () => {
    delete process.env.GEMINI_API_KEY;

    const res = await api(
      'POST',
      '/assistant/ask',
      {
        question: 'How do binary search trees balance?',
      },
      studentToken
    );

    assert.equal(res.status, 503);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'The study assistant is not set up yet.');
  });

  it('6. should return 502 when Gemini fetch fails or times out', async () => {
    globalThis.fetch = async (url, options) => {
      if (typeof url === 'string' && url.includes('localhost')) {
        return originalFetch(url, options);
      }
      // Simulate network / service failure
      throw new Error('Connection refused / timeout');
    };

    const res = await api(
      'POST',
      '/assistant/ask',
      {
        question: 'Explain Dijkstra algorithm',
      },
      mentorToken
    );

    assert.equal(res.status, 502);
    assert.equal(res.body.success, false);
    assert.equal(
      res.body.message,
      'The study assistant is not available right now. Please try again later.'
    );
  });

  it('7. should return 429 when user exceeds rate limit of 10 requests per minute', async () => {
    // Mock successful fetch for rate limit testing
    globalThis.fetch = async (url, options) => {
      if (typeof url === 'string' && url.includes('localhost')) {
        return originalFetch(url, options);
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Mock answer' }] } }],
        }),
      };
    };

    // User sends 10 requests sequentially -> all must succeed
    for (let i = 1; i <= 10; i++) {
      const res = await api(
        'POST',
        '/assistant/ask',
        {
          question: `Question number ${i} for study?`,
        },
        studentToken
      );
      assert.equal(res.status, 200, `Request ${i} should return 200`);
      assert.equal(res.body.success, true);
    }

    // 11th request from the same user should return 429
    const blockedRes = await api(
      'POST',
      '/assistant/ask',
      {
        question: 'Question number 11 should be blocked',
      },
      studentToken
    );

    assert.equal(blockedRes.status, 429);
    assert.equal(blockedRes.body.success, false);
    assert.ok(blockedRes.body.message.includes('Too many requests'));

    // Different user should still be allowed (rate limit is per user)
    const mentorRes = await api(
      'POST',
      '/assistant/ask',
      {
        question: 'Question from mentor should succeed',
      },
      mentorToken
    );
    assert.equal(mentorRes.status, 200);
    assert.equal(mentorRes.body.success, true);
  });
});
