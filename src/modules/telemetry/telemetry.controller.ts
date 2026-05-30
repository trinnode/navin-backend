import type { Request, Response } from 'express';
import { getTelemetryService, bulkIngestTelemetry } from './telemetry.service.js';
import { sendResponse } from '../../shared/http/sendResponse.js';
import type { BulkTelemetryBody } from './telemetry.validation.js';

export const getTelemetry = async (req: Request, res: Response) => {
  const { cursor, limit = 20, shipmentId, from, to, page } = req.query;

  const pageNumber = page ? Number(page) : undefined;
  const { data, nextCursor, hasMore } = await getTelemetryService({
    cursor: cursor as string | undefined,
    page: pageNumber,
    limit: Number(limit),
    shipmentId: shipmentId as string | undefined,
    from: from ? new Date(String(from)) : undefined,
    to: to ? new Date(String(to)) : undefined,
  });

  sendResponse(res, 200, true, 'Telemetry retrieved', data, {
    nextCursor,
    hasMore,
    page: pageNumber ?? 1,
  });
};

export const bulkIngest = async (req: Request, res: Response) => {
  const body = req.body as BulkTelemetryBody;

  const result = await bulkIngestTelemetry(body.items);

  sendResponse(res, 201, true, 'Bulk telemetry ingested', result);
};
