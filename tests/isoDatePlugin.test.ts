import { describe, it, expect } from '@jest/globals';
import { Schema } from 'mongoose';
import { isoDatePlugin } from '../src/shared/plugins/isoDatePlugin.js';

/**
 * Creates a minimal Mongoose-like document shim with a toJSON method that
 * applies the schema's toJSON transform — enough to test the plugin in isolation
 * without a database connection.
 */
function applyTransform(schema: Schema, doc: Record<string, unknown>): Record<string, unknown> {
  const toJSON = schema.get('toJSON') as { transform?: (doc: unknown, ret: Record<string, unknown>) => Record<string, unknown> } | undefined;
  if (typeof toJSON?.transform === 'function') {
    return toJSON.transform(doc, { ...doc });
  }
  return doc;
}

describe('isoDatePlugin', () => {
  it('registers a toJSON transform on the schema', () => {
    const schema = new Schema({ ts: Date });
    isoDatePlugin(schema);
    const toJSON = schema.get('toJSON') as { transform?: unknown };
    expect(typeof toJSON?.transform).toBe('function');
  });

  it('converts top-level Date fields to ISO strings', () => {
    const schema = new Schema({ createdAt: Date, updatedAt: Date });
    isoDatePlugin(schema);

    const doc = {
      createdAt: new Date('2026-04-25T11:00:00.000Z'),
      updatedAt: new Date('2026-04-25T12:00:00.000Z'),
    };

    const result = applyTransform(schema, doc);
    expect(result['createdAt']).toBe('2026-04-25T11:00:00.000Z');
    expect(result['updatedAt']).toBe('2026-04-25T12:00:00.000Z');
  });

  it('converts nested Date fields to ISO strings', () => {
    const schema = new Schema({});
    isoDatePlugin(schema);

    const doc = {
      deliveryProof: {
        uploadedAt: new Date('2026-04-25T14:00:00.000Z'),
        url: 'https://example.com/proof.pdf',
      },
    };

    const result = applyTransform(schema, doc) as {
      deliveryProof: { uploadedAt: string; url: string };
    };
    expect(result.deliveryProof.uploadedAt).toBe('2026-04-25T14:00:00.000Z');
    expect(result.deliveryProof.url).toBe('https://example.com/proof.pdf');
  });

  it('converts Date fields inside arrays', () => {
    const schema = new Schema({});
    isoDatePlugin(schema);

    const doc = {
      milestones: [
        { name: 'CREATED', timestamp: new Date('2026-04-25T10:00:00.000Z') },
        { name: 'IN_TRANSIT', timestamp: new Date('2026-04-25T11:00:00.000Z') },
      ],
    };

    const result = applyTransform(schema, doc) as {
      milestones: Array<{ name: string; timestamp: string }>;
    };
    expect(result.milestones[0].timestamp).toBe('2026-04-25T10:00:00.000Z');
    expect(result.milestones[1].timestamp).toBe('2026-04-25T11:00:00.000Z');
  });

  it('preserves non-Date fields untouched', () => {
    const schema = new Schema({});
    isoDatePlugin(schema);

    const doc = {
      trackingNumber: 'TN-001',
      status: 'CREATED',
      batteryLevel: 95,
      active: true,
    };

    const result = applyTransform(schema, doc);
    expect(result['trackingNumber']).toBe('TN-001');
    expect(result['status']).toBe('CREATED');
    expect(result['batteryLevel']).toBe(95);
    expect(result['active']).toBe(true);
  });

  it('handles null and undefined fields gracefully', () => {
    const schema = new Schema({});
    isoDatePlugin(schema);

    const doc = {
      stellarTxHash: null,
      anchorError: undefined,
      timestamp: new Date('2026-04-25T11:00:00.000Z'),
    };

    expect(() => applyTransform(schema, doc)).not.toThrow();
    const result = applyTransform(schema, doc);
    expect(result['timestamp']).toBe('2026-04-25T11:00:00.000Z');
  });

  it('composes with an existing toJSON transform without clobbering it', () => {
    const schema = new Schema({});
    // Set a pre-existing transform that renames a field.
    schema.set('toJSON', {
      transform: (_doc: unknown, ret: Record<string, unknown>) => {
        return { ...ret, extra: 'injected' };
      },
    });

    isoDatePlugin(schema);

    const doc = { ts: new Date('2026-04-25T11:00:00.000Z') };
    const result = applyTransform(schema, doc);

    // Pre-existing transform output should be preserved.
    expect(result['extra']).toBe('injected');
    // ISO conversion should still be applied.
    expect(result['ts']).toBe('2026-04-25T11:00:00.000Z');
  });

  it('produces UTC Z-suffix timestamps', () => {
    const schema = new Schema({});
    isoDatePlugin(schema);

    const doc = { ts: new Date('2026-04-25T00:00:00.000Z') };
    const result = applyTransform(schema, doc);
    expect((result['ts'] as string)).toMatch(/Z$/);
  });
});
