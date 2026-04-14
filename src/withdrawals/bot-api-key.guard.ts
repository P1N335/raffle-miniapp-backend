import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class BotApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const expectedApiKey = process.env.BOT_API_KEY?.trim();

    if (!expectedApiKey) {
      throw new ForbiddenException('BOT_API_KEY is not configured');
    }

    const request = context.switchToHttp().getRequest<{
      headers: {
        'x-bot-api-key'?: string | string[];
      };
    }>();

    const providedHeader = request.headers['x-bot-api-key'];
    const providedApiKey = Array.isArray(providedHeader)
      ? providedHeader[0]
      : providedHeader;

    if (!providedApiKey) {
      throw new UnauthorizedException('x-bot-api-key header is required');
    }

    const expectedBuffer = Buffer.from(expectedApiKey);
    const providedBuffer = Buffer.from(providedApiKey);

    if (
      expectedBuffer.length !== providedBuffer.length ||
      !timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      throw new UnauthorizedException('Invalid bot API key');
    }

    return true;
  }
}
