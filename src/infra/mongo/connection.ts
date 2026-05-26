import mongoose from 'mongoose';
import { logger } from '../../shared/logger/logger.js';

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 10000,
  maxPoolSize: 10,
} as const;

export async function connectMongo(mongoUri: string) {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (process.env.NODE_ENV === 'test') {
    if (process.env.MONGO_URI) {
      mongoUri = process.env.MONGO_URI;
    } else {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoUri = (await MongoMemoryServer.create()).getUri();
    }
  }

  const connectWithRetry = async (): Promise<void> => {
    logger.info('Attempting MongoDB connection...');
    try {
      await mongoose.connect(mongoUri, MONGO_OPTIONS);
    } catch (err) {
      logger.error(err, 'MongoDB connection failed, retrying in 5s...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectWithRetry();
    }
  };

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected successfully');
  });

  mongoose.connection.on('error', err => {
    logger.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected. Attempting to reconnect...');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected successfully');
  });

  await connectWithRetry();
}

export async function disconnectMongo() {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}
