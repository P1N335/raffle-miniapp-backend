import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { createAuditContext } from '../audit/request-audit-context';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { RateLimit } from '../security/rate-limit.decorator';
import { CoinflipService } from './coinflip.service';
import { CreateCoinflipRoomDto } from './dto/create-coinflip-room.dto';
import { JoinCoinflipRoomDto } from './dto/join-coinflip-room.dto';

@Controller('coinflip')
export class CoinflipController {
  constructor(private readonly coinflipService: CoinflipService) {}

  @Get('rooms')
  async findOpenRooms() {
    return this.coinflipService.findOpenRooms();
  }

  @Get('rooms/:roomId')
  async findRoom(@Param('roomId') roomId: string) {
    return this.coinflipService.findRoom(roomId);
  }

  @RateLimit({
    key: 'coinflip:create-room',
    limit: 8,
    windowMs: 60_000,
    identity: 'ip-user',
  })
  @Post('rooms')
  async createRoom(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Body() dto: CreateCoinflipRoomDto,
  ) {
    return this.coinflipService.createRoom(
      user.id,
      dto,
      createAuditContext(request, user.id),
    );
  }

  @RateLimit({
    key: 'coinflip:cancel-room',
    limit: 10,
    windowMs: 60_000,
    identity: 'ip-user',
  })
  @Post('rooms/:roomId/cancel')
  async cancelRoom(
    @Param('roomId') roomId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.coinflipService.cancelRoom(
      roomId,
      user.id,
      createAuditContext(request, user.id),
    );
  }

  @RateLimit({
    key: 'coinflip:join-room',
    limit: 10,
    windowMs: 60_000,
    identity: 'ip-user',
  })
  @Post('rooms/:roomId/join')
  async joinRoom(
    @Param('roomId') roomId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Body() dto: JoinCoinflipRoomDto,
  ) {
    return this.coinflipService.joinRoom(
      roomId,
      user.id,
      dto,
      createAuditContext(request, user.id),
    );
  }
}
