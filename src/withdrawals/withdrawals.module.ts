import { Module } from '@nestjs/common';
import { WithdrawalsController } from './withdrawals.controller';
import { WithdrawalsService } from './withdrawals.service';
import { BotApiKeyGuard } from './bot-api-key.guard';

@Module({
  controllers: [WithdrawalsController],
  providers: [WithdrawalsService, BotApiKeyGuard],
})
export class WithdrawalsModule {}
