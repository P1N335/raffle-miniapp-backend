import { Body, Controller, Get, Post } from '@nestjs/common';
import { RaffleService } from './raffle.service';
import { JoinRaffleDto } from './dto/join-raffle.dto';

@Controller('raffle')
export class RaffleController {
  constructor(private readonly raffleService: RaffleService) {}

  @Get('active')
  async getActiveRound() {
    return this.raffleService.getActiveRound();
  }

  @Post('join')
  async join(@Body() dto: JoinRaffleDto) {
    return this.raffleService.join(dto);
  }
}