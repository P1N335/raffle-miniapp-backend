import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BalanceTransactionType,
  GiftPurchaseStatus,
  Prisma,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuditContext } from '../audit/audit.types';
import { PrismaService } from '../prisma/prisma.service';
import { PurchaseEngineService } from '../purchases/purchase-engine.service';

type PurchaseRequestRecord = Prisma.GiftPurchaseRequestGetPayload<{
  include: {
    user: true;
    opening: {
      include: {
        giftType: true;
        case: true;
      };
    };
    giftType: true;
  };
}>;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly purchaseEngine: PurchaseEngineService,
  ) {}

  async getOverview() {
    const [
      totalUsers,
      totalBalance,
      pendingWithdrawals,
      purchaseQueue,
      openCoinflipRooms,
      latestAuditLogs,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.aggregate({
        _sum: {
          balanceTon: true,
        },
      }),
      this.prisma.caseOpening.count({
        where: {
          status: 'WITHDRAW_PENDING',
        },
      }),
      this.prisma.giftPurchaseRequest.groupBy({
        by: ['status'],
        _count: {
          _all: true,
        },
      }),
      this.prisma.coinflipRoom.count({
        where: {
          status: 'OPEN',
        },
      }),
      this.prisma.auditLog.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 12,
      }),
    ]);

    return {
      stats: {
        totalUsers,
        totalInternalBalanceTon: totalBalance._sum.balanceTon ?? 0,
        pendingWithdrawals,
        openCoinflipRooms,
      },
      purchaseQueue: purchaseQueue.map((item) => ({
        status: item.status.toLowerCase(),
        count: item._count._all,
      })),
      providers: this.purchaseEngine.getAvailableProviders(),
      recentAuditLogs: latestAuditLogs.map((item) => ({
        id: item.id,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        userId: item.userId,
        createdAt: item.createdAt,
      })),
    };
  }

  async getUsers(limit = 25) {
    const users = await this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: normalizeLimit(limit, 100),
      include: {
        _count: {
          select: {
            caseOpenings: true,
          },
        },
      },
    });

    return users.map((user) => ({
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      balanceTon: user.balanceTon,
      tonWalletAddress: user.tonWalletAddress,
      createdAt: user.createdAt,
      inventoryCount: user._count.caseOpenings,
    }));
  }

  async getBalanceTransactions(limit = 50) {
    const transactions = await this.prisma.balanceTransaction.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: normalizeLimit(limit, 200),
      include: {
        user: {
          select: {
            id: true,
            telegramId: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type.toLowerCase(),
      amountTon: transaction.amountTon,
      balanceAfterTon: transaction.balanceAfterTon,
      referenceType: transaction.referenceType,
      referenceId: transaction.referenceId,
      note: transaction.note,
      createdAt: transaction.createdAt,
      user: transaction.user,
    }));
  }

  async getPendingWithdrawals(limit = 50) {
    const openings = await this.prisma.caseOpening.findMany({
      where: {
        status: 'WITHDRAW_PENDING',
      },
      orderBy: {
        withdrawalRequestedAt: 'asc',
      },
      take: normalizeLimit(limit, 200),
      include: {
        user: true,
        case: true,
        giftType: true,
        giftPurchaseRequest: true,
      },
    });

    return openings.map((opening) => ({
      id: opening.id,
      withdrawalRequestedAt: opening.withdrawalRequestedAt,
      user: opening.user
        ? {
            id: opening.user.id,
            telegramId: opening.user.telegramId,
            username: opening.user.username,
            firstName: opening.user.firstName,
            lastName: opening.user.lastName,
          }
        : null,
      case: {
        id: opening.case.id,
        slug: opening.case.slug,
        name: opening.case.name,
      },
      giftType: {
        id: opening.giftType.id,
        name: opening.giftType.name,
        image: opening.giftType.image,
        estimatedValueTon: opening.giftType.estimatedValueTon,
      },
      purchaseRequestId: opening.giftPurchaseRequest?.id ?? null,
      purchaseStatus: opening.giftPurchaseRequest?.status.toLowerCase() ?? null,
    }));
  }

  async getPurchaseRequests(status?: string, limit = 50) {
    const where =
      status && status !== 'all'
        ? {
            status: parsePurchaseStatus(status),
          }
        : undefined;

    const purchaseRequests = await this.prisma.giftPurchaseRequest.findMany({
      where,
      orderBy: {
        queuedAt: 'asc',
      },
      take: normalizeLimit(limit, 200),
      include: {
        user: true,
        opening: {
          include: {
            giftType: true,
            case: true,
          },
        },
        giftType: true,
      },
    });

    return purchaseRequests.map((item) => this.purchaseEngine.mapPurchaseRequest(item));
  }

  async searchPurchaseRequest(requestId: string, auditContext: AuditContext) {
    return this.purchaseEngine.searchPurchaseRequest(requestId, auditContext);
  }

  async markPurchaseFound(
    requestId: string,
    payload: {
      providerKey: string;
      providerLabel: string;
      externalListingId?: string;
      externalListingUrl?: string;
      quotedPriceTon?: number;
      adminNote?: string;
    },
    auditContext: AuditContext,
  ) {
    const purchaseRequest = await this.purchaseEngine.getPurchaseRequestOrThrow(requestId);
    const updated = await this.prisma.giftPurchaseRequest.update({
      where: { id: requestId },
      data: {
        status: GiftPurchaseStatus.OFFER_FOUND,
        providerKey: payload.providerKey,
        providerLabel: payload.providerLabel,
        externalListingId: payload.externalListingId ?? null,
        externalListingUrl: payload.externalListingUrl ?? null,
        quotedPriceTon: payload.quotedPriceTon ?? null,
        adminNote: payload.adminNote ?? purchaseRequest.adminNote,
        offerFoundAt: purchaseRequest.offerFoundAt ?? new Date(),
        failureReason: null,
      },
      include: purchaseRequestInclude,
    });

    await this.auditService.write({
      ...auditContext,
      action: 'purchase_request.offer_found',
      entityType: 'gift_purchase_request',
      entityId: requestId,
      userId: auditContext.userId ?? null,
      metadata: {
        providerKey: payload.providerKey,
        quotedPriceTon: payload.quotedPriceTon,
      },
    });

    return this.purchaseEngine.mapPurchaseRequest(updated);
  }

  async markPurchasePurchased(
    requestId: string,
    payload: {
      externalOrderId?: string;
      purchasedPriceTon?: number;
      adminNote?: string;
    },
    auditContext: AuditContext,
  ) {
    const purchaseRequest = await this.purchaseEngine.getPurchaseRequestOrThrow(requestId);

    if (
      purchaseRequest.status === GiftPurchaseStatus.DELIVERED ||
      purchaseRequest.status === GiftPurchaseStatus.CANCELLED
    ) {
      throw new BadRequestException('This purchase request can no longer be purchased');
    }

    const updated = await this.prisma.giftPurchaseRequest.update({
      where: { id: requestId },
      data: {
        status: GiftPurchaseStatus.PURCHASED,
        externalOrderId: payload.externalOrderId ?? purchaseRequest.externalOrderId,
        purchasedPriceTon:
          payload.purchasedPriceTon ?? purchaseRequest.purchasedPriceTon,
        purchasedAt: purchaseRequest.purchasedAt ?? new Date(),
        adminNote: payload.adminNote ?? purchaseRequest.adminNote,
        failureReason: null,
      },
      include: purchaseRequestInclude,
    });

    await this.auditService.write({
      ...auditContext,
      action: 'purchase_request.purchased',
      entityType: 'gift_purchase_request',
      entityId: requestId,
      userId: auditContext.userId ?? null,
      metadata: {
        purchasedPriceTon: payload.purchasedPriceTon,
      },
    });

    return this.purchaseEngine.mapPurchaseRequest(updated);
  }

  async markPurchaseDelivered(
    requestId: string,
    payload: {
      deliveryTelegramGiftId?: string;
      adminNote?: string;
    },
    auditContext: AuditContext,
  ) {
    const purchaseRequest = await this.purchaseEngine.getPurchaseRequestOrThrow(requestId);
    const updated = await this.prisma.giftPurchaseRequest.update({
      where: { id: requestId },
      data: {
        status: GiftPurchaseStatus.DELIVERED,
        deliveryTelegramGiftId:
          payload.deliveryTelegramGiftId ?? purchaseRequest.deliveryTelegramGiftId,
        deliveredAt: purchaseRequest.deliveredAt ?? new Date(),
        adminNote: payload.adminNote ?? purchaseRequest.adminNote,
        failureReason: null,
      },
      include: purchaseRequestInclude,
    });

    await this.auditService.write({
      ...auditContext,
      action: 'purchase_request.delivered',
      entityType: 'gift_purchase_request',
      entityId: requestId,
      userId: auditContext.userId ?? null,
      metadata: {
        deliveryTelegramGiftId: payload.deliveryTelegramGiftId,
      },
    });

    return this.purchaseEngine.mapPurchaseRequest(updated);
  }

  async markPurchaseFailed(
    requestId: string,
    payload: {
      reason: string;
      adminNote?: string;
    },
    auditContext: AuditContext,
  ) {
    const purchaseRequest = await this.purchaseEngine.getPurchaseRequestOrThrow(requestId);
    const updated = await this.prisma.giftPurchaseRequest.update({
      where: { id: requestId },
      data: {
        status: GiftPurchaseStatus.FAILED,
        failureReason: payload.reason,
        adminNote: payload.adminNote ?? purchaseRequest.adminNote,
      },
      include: purchaseRequestInclude,
    });

    await this.auditService.write({
      ...auditContext,
      action: 'purchase_request.failed',
      entityType: 'gift_purchase_request',
      entityId: requestId,
      userId: auditContext.userId ?? null,
      metadata: {
        reason: payload.reason,
      },
    });

    return this.purchaseEngine.mapPurchaseRequest(updated);
  }

  async adjustUserBalance(
    targetUserId: string,
    amountTon: number,
    note: string | undefined,
    auditContext: AuditContext,
  ) {
    if (amountTon === 0) {
      throw new BadRequestException('Balance adjustment amount cannot be zero');
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          balanceTon: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (amountTon < 0 && user.balanceTon < Math.abs(amountTon)) {
        throw new BadRequestException('User balance is too low for this debit');
      }

      const updatedUser = await tx.user.update({
        where: { id: targetUserId },
        data: {
          balanceTon: {
            increment: amountTon,
          },
        },
      });

      await tx.balanceTransaction.create({
        data: {
          userId: targetUserId,
          type:
            amountTon > 0
              ? BalanceTransactionType.ADMIN_CREDIT
              : BalanceTransactionType.ADMIN_DEBIT,
          amountTon,
          balanceAfterTon: updatedUser.balanceTon,
          referenceType: 'admin_adjustment',
          note: note ?? null,
        },
      });

      await this.auditService.write(
        {
          ...auditContext,
          action: 'admin.balance_adjustment',
          entityType: 'user',
          entityId: targetUserId,
          userId: auditContext.userId ?? null,
          metadata: {
            amountTon,
            balanceAfterTon: updatedUser.balanceTon,
            note: note ?? null,
          },
        },
        tx,
      );

      return {
        userId: updatedUser.id,
        balanceTon: updatedUser.balanceTon,
      };
    });
  }
}

const purchaseRequestInclude = {
  user: true,
  opening: {
    include: {
      giftType: true,
      case: true,
    },
  },
  giftType: true,
} satisfies Prisma.GiftPurchaseRequestInclude;

function normalizeLimit(limit: number, max: number) {
  return Math.min(Math.max(limit, 1), max);
}

function parsePurchaseStatus(status: string) {
  const normalized = status.trim().toUpperCase();

  switch (normalized) {
    case 'QUEUED':
      return GiftPurchaseStatus.QUEUED;
    case 'SEARCHING':
      return GiftPurchaseStatus.SEARCHING;
    case 'OFFER_FOUND':
      return GiftPurchaseStatus.OFFER_FOUND;
    case 'PURCHASE_PENDING':
      return GiftPurchaseStatus.PURCHASE_PENDING;
    case 'PURCHASED':
      return GiftPurchaseStatus.PURCHASED;
    case 'DELIVERY_PENDING':
      return GiftPurchaseStatus.DELIVERY_PENDING;
    case 'DELIVERED':
      return GiftPurchaseStatus.DELIVERED;
    case 'FAILED':
      return GiftPurchaseStatus.FAILED;
    case 'CANCELLED':
      return GiftPurchaseStatus.CANCELLED;
    default:
      throw new BadRequestException('Unknown purchase status filter');
  }
}
