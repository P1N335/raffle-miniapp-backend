import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { BotApiKeyGuard } from './bot-api-key.guard';
import { CompleteWithdrawalDto } from './dto/complete-withdrawal.dto';
import { FailWithdrawalDto } from './dto/fail-withdrawal.dto';
import { WithdrawalsService } from './withdrawals.service';

@Public()
@UseGuards(BotApiKeyGuard)
@Controller('withdrawals')
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Get('pending')
  findPending(@Query('limit') limit?: string) {
    return this.withdrawalsService.findPending(
      limit ? Number(limit) : undefined,
    );
  }

  @Get(':openingId')
  findOne(@Param('openingId') openingId: string) {
    return this.withdrawalsService.findOne(openingId);
  }

  @Post(':openingId/complete')
  complete(
    @Param('openingId') openingId: string,
    @Body() dto: CompleteWithdrawalDto,
  ) {
    return this.withdrawalsService.complete(
      openingId,
      dto.telegramOwnedGiftId,
    );
  }

  @Post(':openingId/fail')
  fail(
    @Param('openingId') openingId: string,
    @Body() dto: FailWithdrawalDto,
  ) {
    return this.withdrawalsService.fail(openingId, dto.reason);
  }
}
