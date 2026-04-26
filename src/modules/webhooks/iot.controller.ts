import type { RequestHandler } from 'express';

import type { IotWebhookBody } from './iot.validation.js';
import { processIotWebhook } from './iot.service.js';
import { sendResponse } from '../../shared/http/sendResponse.js';

export const iotWebhookController: RequestHandler = async (req, res) => {
  const body = req.body as IotWebhookBody;
  const telemetry = await processIotWebhook(body);

  // Respond immediately with 202 Accepted
  sendResponse(res, 202, true, 'Telemetry received and queued for Stellar anchoring', telemetry);
};
