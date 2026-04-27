import { describe, it, expect } from '@jest/globals';
import { toISOStringOrNull, serializeDates } from '../src/shared/utils/date.js';

// ─────────────────────────────────────────────────────────────────────────────
// toISOStringOrNull
// ─────────────────────────────────────────────────────────────────────────────

describe('toISOStringOrNull', () => {
  it('converts a Date object to an ISO 8601 string', () => {
    const d = new Date('2026-04-25T11:00:00.000Z');
    expect(toISOStringOrNull(d)).toBe('2026-04-25T11:00:00.000Z');
  });

  it('returns null for null input', () => {
    expect(toISOStringOrNull(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(toISOStringOrNull(undefined)).toBeNull();
  });

  it('is idempotent — accepts an already-serialized ISO string', () => {
    const iso = '2026-04-25T11:00:00.000Z';
    expect(toISOStringOrNull(iso)).toBe(iso);
  });

  it('outputs a UTC "Z" suffix, not a localized offset', () => {
    const d = new Date('2026-01-01T00:00:00.000Z');
    const result = toISOStringOrNull(d);
    expect(result).toMatch(/Z$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// serializeDates
// ─────────────────────────────────────────────────────────────────────────────

describe('serializeDates', () => {
  it('converts a top-level Date to an ISO string', () => {
    const d = new Date('2026-04-25T11:00:00.000Z');
    expect(serializeDates(d)).toBe('2026-04-25T11:00:00.000Z');
  });

  it('converts Date fields in a flat object', () => {
    const input = {
      name: 'test',
      createdAt: new Date('2026-04-25T11:00:00.000Z'),
    };
    const result = serializeDates(input);
    expect(result).toEqual({
      name: 'test',
      createdAt: '2026-04-25T11:00:00.000Z',
    });
  });

  it('recursively converts Date fields in nested objects', () => {
    const input = {
      deliveryProof: {
        uploadedAt: new Date('2026-04-25T12:30:00.000Z'),
        url: 'https://example.com/proof.pdf',
      },
    };
    const result = serializeDates(input);
    expect(result).toEqual({
      deliveryProof: {
        uploadedAt: '2026-04-25T12:30:00.000Z',
        url: 'https://example.com/proof.pdf',
      },
    });
  });

  it('recursively converts Date fields inside arrays', () => {
    const input = {
      milestones: [
        { name: 'CREATED', timestamp: new Date('2026-04-25T10:00:00.000Z') },
        { name: 'IN_TRANSIT', timestamp: new Date('2026-04-25T11:00:00.000Z') },
      ],
    };
    const result = serializeDates(input) as unknown as typeof input;
    expect((result.milestones[0] as unknown as { timestamp: string }).timestamp).toBe('2026-04-25T10:00:00.000Z');
    expect((result.milestones[1] as unknown as { timestamp: string }).timestamp).toBe('2026-04-25T11:00:00.000Z');
  });

  it('passes through primitives unchanged', () => {
    expect(serializeDates(42)).toBe(42);
    expect(serializeDates('hello')).toBe('hello');
    expect(serializeDates(true)).toBe(true);
  });

  it('passes through null unchanged', () => {
    expect(serializeDates(null)).toBeNull();
  });

  it('passes through undefined unchanged', () => {
    expect(serializeDates(undefined)).toBeUndefined();
  });

  it('handles arrays of primitives', () => {
    expect(serializeDates([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('handles empty objects', () => {
    expect(serializeDates({})).toEqual({});
  });

  it('handles empty arrays', () => {
    expect(serializeDates([])).toEqual([]);
  });

  it('all serialized dates carry a UTC Z suffix', () => {
    const input = {
      ts1: new Date('2026-01-01T00:00:00.000Z'),
      ts2: new Date('2026-06-15T15:30:45.123Z'),
    };
    const result = serializeDates(input) as unknown as Record<string, string>;
    expect(result['ts1']).toMatch(/Z$/);
    expect(result['ts2']).toMatch(/Z$/);
  });

  it('produces unambiguous ISO 8601 timestamps — no Unix epoch numbers', () => {
    const input = { ts: new Date('2026-04-25T11:00:00.000Z') };
    const result = serializeDates(input) as { ts: unknown };
    // Must be a string, not a number
    expect(typeof result.ts).toBe('string');
    // Must match the ISO 8601 pattern
    expect(result.ts as string).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
