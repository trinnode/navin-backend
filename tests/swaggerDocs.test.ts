import request from 'supertest';
import { buildApp } from '../src/app.js';

describe('Swagger UI dashboard', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('serves Swagger UI outside production', async () => {
    process.env.NODE_ENV = 'development';

    const response = await request(buildApp()).get('/api-docs').redirects(1);

    expect(response.status).toBe(200);
    expect(response.type).toMatch(/html/);
    expect(response.text).toContain('Swagger UI');
  });

  it('disables Swagger UI in production', async () => {
    process.env.NODE_ENV = 'production';

    const response = await request(buildApp()).get('/api-docs').redirects(1);

    expect(response.status).toBe(404);
  });
});