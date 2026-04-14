import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CasesService } from './cases.service';
import { CreateCasePaymentIntentDto } from './dto/create-case-payment-intent.dto';
import { SubmitCasePaymentIntentDto } from './dto/submit-case-payment-intent.dto';

@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get()
  findAll() {
    return this.casesService.findAll();
  }

  @Get('openings')
  findOpenings(
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.casesService.findOpenings(
      userId,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('wallet-balance')
  getWalletBalance(@Query('address') address?: string) {
    if (!address) {
      throw new BadRequestException('Wallet address is required');
    }

    return this.casesService.getWalletBalance(address);
  }

  @Get('payment-intents/:id')
  getPaymentIntentStatus(@Param('id') id: string) {
    return this.casesService.getPaymentIntentStatus(id);
  }

  @Post('payment-intents/:id/submit')
  submitPaymentIntent(
    @Param('id') id: string,
    @Body() dto: SubmitCasePaymentIntentDto,
  ) {
    return this.casesService.submitPaymentIntent(id, dto.boc);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.casesService.findOne(slug);
  }

  @Post(':slug/payment-intents')
  createPaymentIntent(
    @Param('slug') slug: string,
    @Body() dto: CreateCasePaymentIntentDto,
  ) {
    return this.casesService.createPaymentIntent(
      slug,
      dto.userId,
      dto.walletAddress,
    );
  }
}
