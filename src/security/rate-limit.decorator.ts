import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_CONFIG = 'rateLimitConfig';

export type RateLimitConfig = {
  key: string;
  limit: number;
  windowMs: number;
  identity?: 'ip' | 'user' | 'ip-user';
};

export const RateLimit = (config: RateLimitConfig) =>
  SetMetadata(RATE_LIMIT_CONFIG, config);
