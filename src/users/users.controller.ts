import { Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { createAuditContext } from '../audit/request-audit-context';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { RateLimit } from '../security/rate-limit.decorator';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/profile')
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  @Get('me/balance')
  async getBalance(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getBalance(user.id);
  }

  @Get('me/inventory/:openingId')
  async getInventoryItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('openingId') openingId: string,
  ) {
    return this.usersService.getInventoryItem(user.id, openingId);
  }

  @RateLimit({
    key: 'users:inventory:sell',
    limit: 10,
    windowMs: 60_000,
    identity: 'ip-user',
  })
  @Post('me/inventory/:openingId/sell')
  async sellInventoryItem(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Param('openingId') openingId: string,
  ) {
    return this.usersService.sellInventoryItem(
      user.id,
      openingId,
      createAuditContext(request, user.id),
    );
  }

  @RateLimit({
    key: 'users:inventory:withdraw',
    limit: 10,
    windowMs: 60_000,
    identity: 'ip-user',
  })
  @Post('me/inventory/:openingId/withdraw')
  async requestWithdrawInventoryItem(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Param('openingId') openingId: string,
  ) {
    return this.usersService.requestWithdrawInventoryItem(
      user.id,
      openingId,
      createAuditContext(request, user.id),
    );
  }
}
