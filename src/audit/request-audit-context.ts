import { AuditContext } from './audit.types';

type RequestLike = {
  originalUrl?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
};

export function createAuditContext(
  request: RequestLike,
  userId?: string | null,
): AuditContext {
  return {
    userId: userId ?? null,
    requestPath: request.originalUrl ?? request.url ?? null,
    ipAddress: getRequestIp(request),
    userAgent: getFirstHeaderValue(request.headers['user-agent']),
  };
}

function getRequestIp(request: RequestLike) {
  const forwarded = getFirstHeaderValue(request.headers['x-forwarded-for']);

  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? null;
  }

  return request.ip ?? request.socket?.remoteAddress ?? null;
}

function getFirstHeaderValue(value: string | string[] | undefined) {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}
