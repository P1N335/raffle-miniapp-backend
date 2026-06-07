import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_ROUTE } from '../auth/public.decorator';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const REQUEST_VERIFICATION_HEADER = 'x-miniapp-request';
const REQUEST_VERIFICATION_VALUE = '1';

@Injectable()
export class RequestVerificationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_ROUTE,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      method?: string;
      headers: Record<string, string | string[] | undefined>;
    }>();

    if (SAFE_METHODS.has((request.method ?? 'GET').toUpperCase())) {
      return true;
    }

    const headerValue = getFirstHeaderValue(
      request.headers[REQUEST_VERIFICATION_HEADER],
    );

    if (headerValue !== REQUEST_VERIFICATION_VALUE) {
      throw new ForbiddenException('Verified application request header is required');
    }

    return true;
  }
}

function getFirstHeaderValue(value: string | string[] | undefined) {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}
