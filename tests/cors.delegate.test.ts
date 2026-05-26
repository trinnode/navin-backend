import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { Request } from 'express';

describe('corsOptionsDelegate', () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.ALLOWED_ORIGINS;
  });

  function mockRequest(origin?: string): Request {
    return {
      header: (name: string) => (name.toLowerCase() === 'origin' ? origin : undefined),
    } as Request;
  }

  async function resolveCorsOptions(req: Request) {
    const { corsOptionsDelegate } = await import('../src/config/cors.js');
    return new Promise<{ origin: boolean; credentials: boolean }>((resolve, reject) => {
      corsOptionsDelegate(req, (err, options) => {
        if (err) reject(err);
        else resolve(options as { origin: boolean; credentials: boolean });
      });
    });
  }

  it('returns credentials: true when Origin header is absent', async () => {
    const options = await resolveCorsOptions(mockRequest());
    expect(options).toEqual({ origin: true, credentials: true });
  });

  it('returns credentials: true for allowed origins', async () => {
    process.env.ALLOWED_ORIGINS = 'https://allowed.example,https://app.example';
    const options = await resolveCorsOptions(mockRequest('https://allowed.example'));
    expect(options).toEqual({ origin: true, credentials: true });
  });

  it('rejects unlisted origins', async () => {
    process.env.ALLOWED_ORIGINS = 'https://allowed.example';
    await expect(resolveCorsOptions(mockRequest('https://blocked.example'))).rejects.toThrow(
      'Not allowed by CORS'
    );
  });
});
