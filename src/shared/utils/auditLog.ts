import { logger } from '../logger/logger.js';

export type AuditAction = 'SHIPMENT_STATUS_CHANGED' | 'RBAC_ROLE_MODIFIED' | 'API_KEY_GENERATED';

export interface AuditLogParams {
  userId: string;
  action: AuditAction;
  resourceId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export function auditLog(params: AuditLogParams): void {
  logger.info(
    {
      audit: true,
      userId: params.userId,
      action: params.action,
      resourceId: params.resourceId,
      timestamp: params.timestamp.toISOString(),
      ...(params.metadata && { metadata: params.metadata }),
    },
    `AUDIT: ${params.action}`
  );
}
