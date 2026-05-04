import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { createAuditContext } from '../audit/request-audit-context';
import { RateLimit } from '../security/rate-limit.decorator';
import { AuthService } from './auth.service';
import { AuthTelegramDto } from './dto/auth-telegram.dto';
import { CurrentUser } from './current-user.decorator';
import type { AuthenticatedUser } from './authenticated-user';
import { AUTH_SESSION_COOKIE_NAME } from './auth-session.constants';
import {
  getClearedSessionCookieOptions,
  getCookieValue,
  getSessionCookieOptions,
} from './auth-session.utils';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @RateLimit({
    key: 'auth:telegram',
    limit: 12,
    windowMs: 60_000,
    identity: 'ip',
  })
  @Post('telegram')
  async authTelegram(
    @Body() dto: AuthTelegramDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const payload = await this.authService.authWithTelegram(
      dto.initData,
      createAuditContext(request),
    );

    response.cookie(
      AUTH_SESSION_COOKIE_NAME,
      payload.sessionToken,
      getSessionCookieOptions(payload.sessionExpiresAt),
    );

    return payload.user;
  }

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Post('logout')
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const sessionToken = getCookieValue(request.headers.cookie);

    if (sessionToken) {
      await this.authService.revokeSession(
        sessionToken,
        createAuditContext(request, user.id),
      );
    }

    response.cookie(
      AUTH_SESSION_COOKIE_NAME,
      '',
      getClearedSessionCookieOptions(),
    );

    return {
      success: true,
    };
  }
}
