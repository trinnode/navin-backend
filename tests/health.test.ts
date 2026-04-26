import request from 'supertest';
import { buildApp } from '../src/app.js';

describe('Health Check Endpoint', () => {
  const app = buildApp();

  it('GET /api/health should return 200 OK with standard response wrapper', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'OK',
      data: { status: 'active' },
    });
  });
});
