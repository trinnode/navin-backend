import { Redis } from 'ioredis';
import { config } from '../../config/index.js';
import { logger } from '../../shared/logger/logger.js';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    logger.info('Initializing Redis client...');
    redisClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: null,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        logger.warn(`Redis connection failed, retrying in ${delay}ms... (attempt ${times})`);
        return delay;
      },
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('error', err => {
      logger.error(err, 'Redis error');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });
  }
  return redisClient;
}

/** Shared Redis connection for BullMQ workers and queues (lazy — no connect at import time). */
export function getRedisConnection(): Redis {
  return getRedisClient();
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await (redisClient as import('ioredis').Redis).quit();
    redisClient = null;
  }
}
