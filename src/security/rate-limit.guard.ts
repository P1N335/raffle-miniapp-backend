import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { RATE_LIMIT_CONFIG, RateLimitConfig } from './rate-limit.decorator';

type Bucket = {
  count: number;
  resetAt: number;
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const config = this.reflector.getAllAndOverride<RateLimitConfig | undefined>(
      RATE_LIMIT_CONFIG,
      [context.getHandler(), context.getClass()],
    );

    if (!config) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      ip?: string;
      socket?: { remoteAddress?: string };
      authUser?: AuthenticatedUser;
    }>();

    const identifier = this.resolveIdentity(config.identity ?? 'ip-user', request);
    const bucketKey = `${config.key}:${identifier}`;
    const now = Date.now();
    const current = this.buckets.get(bucketKey);

    if (!current || current.resetAt <= now) {
      this.buckets.set(bucketKey, {
        count: 1,
        resetAt: now + config.windowMs,
      });
      this.cleanup(now);
      return true;
    }

    if (current.count >= config.limit) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((current.resetAt - now) / 1000),
      );

      throw new HttpException(
        `Too many requests. Try again in ${retryAfterSeconds} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    current.count += 1;
    this.buckets.set(bucketKey, current);
    this.cleanup(now);
    return true;
  }

  private resolveIdentity(
    identity: RateLimitConfig['identity'],
    request: {
      headers: Record<string, string | string[] | undefined>;
      ip?: string;
      socket?: { remoteAddress?: string };
      authUser?: AuthenticatedUser;
    },
  ) {
    const ip = this.getIpAddress(request);
    const userId = request.authUser?.id ?? 'anonymous';

    switch (identity) {
      case 'user':
        return userId;
      case 'ip':
        return ip;
      case 'ip-user':
      default:
        return `${ip}:${userId}`;
    }
  }

  private getIpAddress(request: {
    headers: Record<string, string | string[] | undefined>;
    ip?: string;
    socket?: { remoteAddress?: string };
  }) {
    const forwarded = request.headers['x-forwarded-for'];
    const rawForwarded = Array.isArray(forwarded) ? forwarded[0] : forwarded;

    if (rawForwarded) {
      return rawForwarded.split(',')[0]?.trim() ?? 'unknown';
    }

    return request.ip ?? request.socket?.remoteAddress ?? 'unknown';
  }

  private cleanup(now: number) {
    if (this.buckets.size <= 5000) {
      return;
    }

    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }
}
