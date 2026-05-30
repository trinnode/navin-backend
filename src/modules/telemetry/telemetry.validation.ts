import { z } from 'zod';

export const TelemetryQuerySchema = z.object({
  cursor: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  shipmentId: z.string().trim().optional(),
});

const BulkTelemetryItemSchema = z.object({
  shipmentId: z.string().trim().min(1),
  temperature: z.number().min(-50).max(100),
  humidity: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  batteryLevel: z.number().min(0).max(100),
  timestamp: z.coerce.date(),
  sensorId: z.string().trim().optional(),
});

export const BulkTelemetryBodySchema = z.object({
  items: z.array(BulkTelemetryItemSchema).min(1).max(1000),
});

export type BulkTelemetryItem = z.infer<typeof BulkTelemetryItemSchema>;
export type BulkTelemetryBody = z.infer<typeof BulkTelemetryBodySchema>;
