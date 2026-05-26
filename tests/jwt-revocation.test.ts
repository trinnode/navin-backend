import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const VALID_JTI = '550e8400-e29b-41d4-a716-446655440000';

describe('Token Blocklist', () => {
  const store = new Map<string, string>();
  const mockSet = jest.fn(
    async (key: string, value: string, _ex?: string, _ttl?: number) => {
      store.set(key, value);
      return 'OK';
    }
  );
  const mockGet = jest.fn(async (key: string) => store.get(key) ?? null);

  beforeEach(async () => {
    jest.resetModules();
    store.clear();
    mockSet.mockClear();
    mockGet.mockClear();

    await jest.unstable_mockModule('../src/infra/redis/connection.js', () => ({
      getRedisClient: () => ({ set: mockSet, get: mockGet }),
      getRedisConnection: () => ({ set: mockSet, get: mockGet }),
      disconnectRedis: jest.fn(),
    }));
  });

  it('returns false for a token not in the blocklist', async () => {
    const { isTokenBlocked } = await import('../src/infra/redis/tokenBlocklist.js');
    expect(await isTokenBlocked(VALID_JTI)).toBe(false);
  });

  it('returns true after blocking a token', async () => {
    const { isTokenBlocked, blockToken } = await import('../src/infra/redis/tokenBlocklist.js');
    await blockToken(VALID_JTI, 3600);
    expect(await isTokenBlocked(VALID_JTI)).toBe(true);
  });

  it('stores tokens with strict UUID prefix', async () => {
    const { blockToken, BLOCKLIST_PREFIX } = await import('../src/infra/redis/tokenBlocklist.js');
    await blockToken(VALID_JTI, 3600);
    expect(store.has(`${BLOCKLIST_PREFIX}${VALID_JTI.toLowerCase()}`)).toBe(true);
  });

  it('rejects invalid JTI format when blocking', async () => {
    const { blockToken } = await import('../src/infra/redis/tokenBlocklist.js');
    await expect(blockToken('not-a-uuid', 3600)).rejects.toThrow('Invalid token identifier');
  });

  it('returns false for invalid JTI without hitting Redis lookup path', async () => {
    const { isTokenBlocked, isValidJti } = await import('../src/infra/redis/tokenBlocklist.js');
    expect(isValidJti('bad-jti')).toBe(false);
    expect(await isTokenBlocked('bad-jti')).toBe(false);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('completes revocation checks in less than 2ms', async () => {
    const { isTokenBlocked, blockToken } = await import('../src/infra/redis/tokenBlocklist.js');
    await blockToken(VALID_JTI, 3600);

    const start = performance.now();
    await isTokenBlocked(VALID_JTI);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(2);
  });

  it('skips block when ttl is zero or negative', async () => {
    const { blockToken, isTokenBlocked } = await import('../src/infra/redis/tokenBlocklist.js');
    await blockToken(VALID_JTI, 0);
    expect(await isTokenBlocked(VALID_JTI)).toBe(false);
    expect(mockSet).not.toHaveBeenCalled();
  });
});
