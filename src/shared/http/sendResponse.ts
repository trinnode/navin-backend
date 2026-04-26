import type { Response } from 'express';

export interface ResponseMeta {
  [key: string]: unknown;
}

/**
 * Sends a standardised JSON response so every endpoint has the same envelope:
 *
 * ```json
 * {
 *   "success": true,
 *   "message": "...",
 *   "data": { ... } | [ ... ] | null,
 *   "meta": { ... }          // optional – pagination cursors live here
 * }
 * ```
 */
export function sendResponse(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data: unknown,
  meta?: ResponseMeta,
): void {
  const body: Record<string, unknown> = { success, message, data };

  if (meta !== undefined) {
    body.meta = meta;
  }

  res.status(statusCode).json(body);
}
