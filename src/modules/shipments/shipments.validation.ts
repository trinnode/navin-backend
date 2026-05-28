import { z } from 'zod';
import { ShipmentStatus } from './shipments.model.js';

export const ShipmentIdParamSchema = z.object({
  id: z.string().trim().min(1),
});

export const CreateShipmentBodySchema = z.object({
  trackingNumber: z.string().trim().min(1).optional(),
  origin: z.string().trim().min(1),
  destination: z.string().trim().min(1),
  enterpriseId: z.string().trim().min(1),
  logisticsId: z.string().trim().min(1),
  status: z.nativeEnum(ShipmentStatus).optional(),
  milestones: z.array(z.unknown()).optional(),
  offChainMetadata: z.record(z.unknown()).optional(),
});

export const ShipmentPatchBodySchema = z.object({
  offChainMetadata: z.record(z.unknown()),
});

export const ShipmentStatusBodySchema = z.object({
  status: z.nativeEnum(ShipmentStatus),
});

export const ShipmentProofBodySchema = z.object({
  recipientSignatureName: z.string().trim().min(1).optional(),
  notes: z.string().trim().optional(),
});

export const ShipmentsQuerySchema = z.object({
  status: z.nativeEnum(ShipmentStatus).optional(),
  cursor: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
