import type { Request, Response } from 'express';
import { getTelemetryService } from './telemetry.service.js';
import { sendResponse } from '../../shared/http/sendResponse.js';

export const getTelemetry = async (req: Request, res: Response) => {
  const { cursor, limit = 20, shipmentId } = req.query;

  const { data, nextCursor, hasMore } = await getTelemetryService({
    cursor: cursor as string | undefined,
    limit: Number(limit),
    shipmentId: shipmentId as string | undefined,
  });

  sendResponse(res, 200, true, 'Telemetry retrieved', data, { nextCursor, hasMore });
};
