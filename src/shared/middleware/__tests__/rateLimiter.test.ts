import { describe, it, expect, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { standardLimiter } from '../rateLimiter.js';

import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';

function buildTestApp(limiter: RequestHandler) {
  const app = express();
  app.use(limiter);
  app.get('/test', (_req, res) => res.json({ success: true }));
  return app;
}

describe('standardLimiter', () => {
  it('allows requests under the limit', async () => {
    const app = buildTestApp(standardLimiter);
    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
  });

  it('returns RateLimit headers', async () => {
    const app = buildTestApp(standardLimiter);
    const res = await request(app).get('/test');
    expect(res.headers['ratelimit-limit']).toBeDefined();
    expect(res.headers['ratelimit-remaining']).toBeDefined();
  });

  it('uses a one-minute window in development', async () => {
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    jest.resetModules();

    const { standardLimiter: devLimiter } = await import('../rateLimiter.js');
    const app = buildTestApp(devLimiter);

    for (let i = 0; i < 100; i += 1) {
      const res = await request(app).get('/test');
      expect(res.status).toBe(200);
    }

    const limited = await request(app).get('/test');
    expect(limited.status).toBe(429);
    expect(limited.body).toEqual({
      success: false,
      message: 'Too many requests, please try again later.',
    });

    process.env.NODE_ENV = previousEnv;
  });

  it('skips rate limiting for authenticated bearer tokens', async () => {
    const app = buildTestApp(standardLimiter);

    for (let i = 0; i < 105; i += 1) {
      const res = await request(app)
        .get('/test')
        .set('Authorization', 'Bearer test-token');
      expect(res.status).toBe(200);
    }
  });
});

describe('strictLimiter', () => {
  it('returns 429 after exceeding limit', async () => {
    const app = buildTestApp(
      rateLimit({
        windowMs: 60000,
        limit: 3,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message: 'Too many requests, please slow down.' },
      })
    );

    for (let i = 0; i < 3; i++) await request(app).get('/test');
    const res = await request(app).get('/test');

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Too many requests, please slow down.');
  });
});
