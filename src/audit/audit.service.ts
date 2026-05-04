import { Injectable, Logger } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogInput } from './audit.types';

type PrismaLike = PrismaService | Prisma.TransactionClient | PrismaClient;

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async write(entry: AuditLogInput, client?: PrismaLike) {
    const target = client ?? this.prisma;

    try {
      await target.auditLog.create({
        data: {
          userId: entry.userId ?? null,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId ?? null,
          requestPath: entry.requestPath ?? null,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent ?? null,
          metadata: entry.metadata,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to write audit log "${entry.action}": ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
