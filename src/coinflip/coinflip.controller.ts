import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CoinflipService } from './coinflip.service';
import { CreateCoinflipRoomDto } from './dto/create-coinflip-room.dto';
import { JoinCoinflipRoomDto } from './dto/join-coinflip-room.dto';
import { CancelCoinflipRoomDto } from './dto/cancel-coinflip-room.dto';

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

  @Post('rooms')
  async createRoom(@Body() dto: CreateCoinflipRoomDto) {
    return this.coinflipService.createRoom(dto);
  }

  @Post('rooms/:roomId/cancel')
  async cancelRoom(
    @Param('roomId') roomId: string,
    @Body() dto: CancelCoinflipRoomDto,
  ) {
    return this.coinflipService.cancelRoom(roomId, dto.userId);
  }

  @Post('rooms/:roomId/join')
  async joinRoom(
    @Param('roomId') roomId: string,
    @Body() dto: JoinCoinflipRoomDto,
  ) {
    return this.coinflipService.joinRoom(roomId, dto);
  }
}
