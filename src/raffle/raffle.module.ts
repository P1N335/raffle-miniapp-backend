import { Module } from '@nestjs/common';
import { RaffleController } from './raffle.controller';
import { RaffleService } from './raffle.service';

@Module({
  controllers: [RaffleController],
  providers: [RaffleService],
})
export class RaffleModule {}