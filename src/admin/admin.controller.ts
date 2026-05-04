import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { createAuditContext } from '../audit/request-audit-context';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { AdminBalanceAdjustmentDto } from './dto/admin-balance-adjustment.dto';
import { MarkPurchaseDeliveredDto } from './dto/mark-purchase-delivered.dto';
import { MarkPurchaseFailedDto } from './dto/mark-purchase-failed.dto';
import { MarkPurchaseFoundDto } from './dto/mark-purchase-found.dto';
import { MarkPurchasePurchasedDto } from './dto/mark-purchase-purchased.dto';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return {
      isAdmin: true,
      user,
    };
  }

  @Get('overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  @Get('users')
  getUsers(@Query('limit') limit?: string) {
    return this.adminService.getUsers(limit ? Number(limit) : undefined);
  }

  @Get('balance-transactions')
  getBalanceTransactions(@Query('limit') limit?: string) {
    return this.adminService.getBalanceTransactions(
      limit ? Number(limit) : undefined,
    );
  }

  @Get('withdrawals')
  getPendingWithdrawals(@Query('limit') limit?: string) {
    return this.adminService.getPendingWithdrawals(
      limit ? Number(limit) : undefined,
    );
  }

  @Get('purchase-requests')
  getPurchaseRequests(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getPurchaseRequests(
      status,
      limit ? Number(limit) : undefined,
    );
  }

  @Post('users/:userId/balance-adjustments')
  adjustUserBalance(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Body() dto: AdminBalanceAdjustmentDto,
  ) {
    return this.adminService.adjustUserBalance(
      userId,
      dto.amountTon,
      dto.note,
      createAuditContext(request, user.id),
    );
  }

  @Post('purchase-requests/:requestId/search')
  searchPurchaseRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.adminService.searchPurchaseRequest(
      requestId,
      createAuditContext(request, user.id),
    );
  }

  @Post('purchase-requests/:requestId/mark-found')
  markPurchaseFound(
    @Param('requestId') requestId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Body() dto: MarkPurchaseFoundDto,
  ) {
    return this.adminService.markPurchaseFound(
      requestId,
      dto,
      createAuditContext(request, user.id),
    );
  }

  @Post('purchase-requests/:requestId/mark-purchased')
  markPurchasePurchased(
    @Param('requestId') requestId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Body() dto: MarkPurchasePurchasedDto,
  ) {
    return this.adminService.markPurchasePurchased(
      requestId,
      dto,
      createAuditContext(request, user.id),
    );
  }

  @Post('purchase-requests/:requestId/mark-delivered')
  markPurchaseDelivered(
    @Param('requestId') requestId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Body() dto: MarkPurchaseDeliveredDto,
  ) {
    return this.adminService.markPurchaseDelivered(
      requestId,
      dto,
      createAuditContext(request, user.id),
    );
  }

  @Post('purchase-requests/:requestId/fail')
  markPurchaseFailed(
    @Param('requestId') requestId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Body() dto: MarkPurchaseFailedDto,
  ) {
    return this.adminService.markPurchaseFailed(
      requestId,
      dto,
      createAuditContext(request, user.id),
    );
  }
}
