import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { parse, validate } from '@tma.js/init-data-node';
import {
  AUTH_SESSION_TTL_DAYS,
} from './auth-session.constants';
import { AuditService } from '../audit/audit.service';
import { AuditContext } from '../audit/audit.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async authWithTelegram(initDataRaw: string, auditContext: AuditContext) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      throw new BadRequestException('TELEGRAM_BOT_TOKEN is not configured');
    }

    try {
      validate(initDataRaw, botToken);
    } catch (error) {
      this.logger.warn(
        `Telegram initData validation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw new UnauthorizedException('Invalid Telegram initData');
    }

    const initData = parse(initDataRaw);

    if (!initData.user) {
      throw new BadRequestException('Telegram user not found in initData');
    }

    const tgUser = initData.user;

    const username =
      typeof tgUser.username === 'string' ? tgUser.username : null;

    const firstName =
      typeof tgUser.firstName === 'string' ? tgUser.firstName : null;

    const lastName =
      typeof tgUser.lastName === 'string' ? tgUser.lastName : null;

    const photoUrl =
      typeof tgUser.photoUrl === 'string' ? tgUser.photoUrl : null;

    const user = await this.prisma.user.upsert({
      where: {
        telegramId: String(tgUser.id),
      },
      update: {
        username,
        firstName,
        lastName,
        photoUrl,
      },
      create: {
        telegramId: String(tgUser.id),
        username,
        firstName,
        lastName,
        photoUrl,
      },
    });

    const session = await this.createSession(user.id, auditContext);

    await this.auditService.write({
      ...auditContext,
      userId: user.id,
      action: 'auth.telegram.login',
      entityType: 'auth_session',
      entityId: session.id,
      metadata: {
        telegramId: user.telegramId,
      },
    });

    return {
      user: this.mapUser(user),
      sessionToken: session.token,
      sessionExpiresAt: session.expiresAt,
    };
  }

  async revokeSession(sessionToken: string, auditContext: AuditContext) {
    const tokenHash = createHash('sha256').update(sessionToken).digest('hex');
    const session = await this.prisma.authSession.findUnique({
      where: {
        tokenHash,
      },
    });

    if (!session || session.revokedAt) {
      return;
    }

    await this.prisma.authSession.update({
      where: {
        id: session.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    await this.auditService.write({
      ...auditContext,
      userId: session.userId,
      action: 'auth.session.logout',
      entityType: 'auth_session',
      entityId: session.id,
    });
  }

  private async createSession(userId: string, auditContext: AuditContext) {
    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(
      Date.now() + normalizeSessionTtlDays() * 24 * 60 * 60 * 1000,
    );

    const session = await this.prisma.authSession.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        ipAddress: auditContext.ipAddress ?? null,
        userAgent: auditContext.userAgent ?? null,
      },
      select: {
        id: true,
        expiresAt: true,
      },
    });

    return {
      id: session.id,
      token,
      expiresAt: session.expiresAt,
    };
  }

  private mapUser(user: {
    id: string;
    telegramId: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    photoUrl: string | null;
  }) {
    return {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.photoUrl,
    };
  }
}

function normalizeSessionTtlDays() {
  if (Number.isFinite(AUTH_SESSION_TTL_DAYS) && AUTH_SESSION_TTL_DAYS > 0) {
    return AUTH_SESSION_TTL_DAYS;
  }

  return 30;
}
