/**
 * ISO 8601 Date Serialization Utilities
 *
 * Provides helpers to ensure all Date values are serialized as ISO 8601 UTC
 * strings (e.g. "2026-04-25T11:00:00.000Z") throughout API responses.
 */

/**
 * Converts a value to an ISO 8601 string if it is a Date, otherwise returns
 * it unchanged.  Returns `null` when given `null` or `undefined`.
 */
export function toISOStringOrNull(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  // Accept already-serialized ISO strings so callers can be idempotent.
  return value;
}

/**
 * Recursively walks a plain-object tree and replaces every `Date` instance
 * with its `.toISOString()` representation.
 *
 * Safe to call on `JSON.parse(JSON.stringify(doc))` results (lean docs) as
 * well as on live Mongoose documents converted via `.toObject()`.
 */
export function serializeDates<T>(value: T): T {
  if (value === null || value === undefined) return value;

  if (value instanceof Date) {
    return value.toISOString() as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map(serializeDates) as unknown as T;
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = serializeDates(v);
    }
    return result as T;
  }

  return value;
}
