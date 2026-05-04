import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AUTH_SESSION_REFRESH_INTERVAL_MS } from './auth-session.constants';
import { AuthenticatedUser } from './authenticated-user';
import { getCookieValue } from './auth-session.utils';
import { IS_PUBLIC_ROUTE } from './public.decorator';

@Injectable()
export class AuthSessionGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      method: string;
      headers: Record<string, string | string[] | undefined>;
      authUser?: AuthenticatedUser;
    }>();

    if (request.method === 'OPTIONS') {
      return true;
    }

    const sessionToken = getCookieValue(request.headers.cookie);

    if (!sessionToken) {
      throw new UnauthorizedException('Authentication is required');
    }

    const tokenHash = createHash('sha256').update(sessionToken).digest('hex');
    const session = await this.prisma.authSession.findUnique({
      where: {
        tokenHash,
      },
      include: {
        user: {
          select: {
            id: true,
            telegramId: true,
            username: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
          },
        },
      },
    });

    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      if (session && !session.revokedAt) {
        await this.prisma.authSession.update({
          where: { id: session.id },
          data: {
            revokedAt: session.revokedAt ?? new Date(),
          },
        });
      }

      throw new UnauthorizedException('Session expired or invalid');
    }

    request.authUser = session.user;

    if (
      Date.now() - session.lastUsedAt.getTime() >=
      AUTH_SESSION_REFRESH_INTERVAL_MS
    ) {
      await this.prisma.authSession.update({
        where: { id: session.id },
        data: {
          lastUsedAt: new Date(),
        },
      });
    }

    return true;
  }
}
