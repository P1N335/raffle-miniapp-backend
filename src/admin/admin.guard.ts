import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/authenticated-user';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      authUser?: AuthenticatedUser;
    }>();

    const telegramId = request.authUser?.telegramId;
    const allowedIds = getAdminTelegramIds();

    if (!telegramId || !allowedIds.has(telegramId)) {
      throw new ForbiddenException('Admin access is required');
    }

    return true;
  }
}

function getAdminTelegramIds() {
  return new Set(
    (process.env.ADMIN_TELEGRAM_IDS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  );
}
