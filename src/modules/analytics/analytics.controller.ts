import type { RequestHandler } from 'express';

import type { PerformanceQuery } from './analytics.validation.js';
import { getAnalyticsPerformance } from './analytics.service.js';
import { sendResponse } from '../../shared/http/sendResponse.js';

export const getPerformanceController: RequestHandler = async (req, res) => {
  const query = req.query as unknown as PerformanceQuery;
  const dashboard = await getAnalyticsPerformance(query);
  sendResponse(res, 200, true, 'Analytics retrieved', dashboard);
};
