import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../infra/redis/connection.js';
import { AlertPayload } from '../services/queue.service.js';
import { logger } from '../shared/logger/logger.js';

async function processAlert(job: Job<AlertPayload>): Promise<void> {
  const { type, message, shipmentId } = job.data;

  await new Promise(resolve => setTimeout(resolve, 1000));

  logger.info({ type, message, shipmentId }, 'Alert sent');
}

export function startAlertWorker(): Worker<AlertPayload> {
  const worker = new Worker<AlertPayload>('alert_queue', processAlert, {
    connection: getRedisConnection() as any,
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Alert worker job failed');
  });

  return worker;
}
