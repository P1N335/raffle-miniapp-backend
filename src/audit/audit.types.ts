import { Prisma } from '@prisma/client';

export type AuditLogInput = {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  requestPath?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export type AuditContext = {
  userId?: string | null;
  requestPath?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};
