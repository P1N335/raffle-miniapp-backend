import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { createAuditContext } from '../audit/request-audit-context';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { RateLimit } from '../security/rate-limit.decorator';
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
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: string,
  ) {
    return this.casesService.findOpenings(user.id, limit ? Number(limit) : undefined);
  }

  @RateLimit({
    key: 'cases:wallet-balance',
    limit: 30,
    windowMs: 60_000,
    identity: 'ip-user',
  })
  @Get('wallet-balance')
  getWalletBalance(@Query('address') address?: string) {
    if (!address) {
      throw new BadRequestException('Wallet address is required');
    }

    return this.casesService.getWalletBalance(address);
  }

  @RateLimit({
    key: 'cases:payment-intent:status',
    limit: 60,
    windowMs: 60_000,
    identity: 'ip-user',
  })
  @Get('payment-intents/:id')
  getPaymentIntentStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.casesService.getPaymentIntentStatus(id, user.id);
  }

  @RateLimit({
    key: 'cases:payment-intent:submit',
    limit: 30,
    windowMs: 60_000,
    identity: 'ip-user',
  })
  @Post('payment-intents/:id/submit')
  submitPaymentIntent(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitCasePaymentIntentDto,
  ) {
    return this.casesService.submitPaymentIntent(id, user.id, dto.boc);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.casesService.findOne(slug);
  }

  @RateLimit({
    key: 'cases:payment-intent:create',
    limit: 12,
    windowMs: 60_000,
    identity: 'ip-user',
  })
  @Post(':slug/payment-intents')
  createPaymentIntent(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Body() dto: CreateCasePaymentIntentDto,
  ) {
    return this.casesService.createPaymentIntent(
      slug,
      user.id,
      dto.walletAddress,
      createAuditContext(request, user.id),
    );
  }

  @RateLimit({
    key: 'cases:open-with-balance',
    limit: 10,
    windowMs: 60_000,
    identity: 'ip-user',
  })
  @Post(':slug/open-with-balance')
  openWithBalance(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.casesService.openWithBalance(
      slug,
      user.id,
      createAuditContext(request, user.id),
    );
  }
}
