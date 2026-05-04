import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BalanceTransactionType,
  CaseOpeningStatus,
  GiftPurchaseStatus,
  Prisma,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuditContext } from '../audit/audit.types';
import { PrismaService } from '../prisma/prisma.service';

type CaseOpeningRecord = Prisma.CaseOpeningGetPayload<{
  include: {
    case: true;
    giftType: true;
  };
}>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        balanceTon: true,
        tonWalletAddress: true,
        tonWalletNetwork: true,
        tonWalletConnectedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const openings = await this.prisma.caseOpening.findMany({
      where: {
        userId,
      },
      include: {
        case: true,
        giftType: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalWonTon = openings.reduce(
      (sum, opening) => sum + opening.giftType.estimatedValueTon,
      0,
    );
    const totalSoldTon = openings.reduce(
      (sum, opening) => sum + (opening.soldAmountTon ?? 0),
      0,
    );
    const mostExpensiveOpening = openings.reduce<(typeof openings)[number] | null>(
      (highest, opening) => {
        if (!highest) {
          return opening;
        }

        return opening.giftType.estimatedValueTon >
          highest.giftType.estimatedValueTon
          ? opening
          : highest;
      },
      null,
    );

    const activeInventory = openings.filter(
      (opening) => opening.status === CaseOpeningStatus.OWNED,
    );

    return {
      user,
      summary: {
        balanceTon: user.balanceTon,
        totalWonTon,
        totalItemsWon: openings.length,
        activeInventoryCount: activeInventory.length,
        totalSoldTon,
        mostExpensiveGift: mostExpensiveOpening
          ? this.mapInventoryItem(mostExpensiveOpening)
          : null,
      },
      inventory: activeInventory.map((opening) => this.mapInventoryItem(opening)),
      openingHistory: openings.map((opening) => this.mapHistoryEntry(opening)),
    };
  }

  async getBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        balanceTon: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      userId: user.id,
      balanceTon: user.balanceTon,
    };
  }

  async getInventoryItem(userId: string, openingId: string) {
    const opening = await this.prisma.caseOpening.findFirst({
      where: {
        id: openingId,
        userId,
      },
      include: {
        case: true,
        giftType: true,
      },
    });

    if (!opening) {
      throw new NotFoundException('Inventory item not found');
    }

    return this.mapInventoryItem(opening);
  }

  async sellInventoryItem(
    userId: string,
    openingId: string,
    auditContext: AuditContext,
  ) {
    const opening = await this.prisma.caseOpening.findFirst({
      where: {
        id: openingId,
        userId,
      },
      include: {
        case: true,
        giftType: true,
      },
    });

    if (!opening) {
      throw new NotFoundException('Inventory item not found');
    }

    if (opening.status !== CaseOpeningStatus.OWNED) {
      throw new BadRequestException('Only owned items can be sold');
    }

    const updatedOpening = await this.prisma.$transaction(async (tx) => {
      const soldAt = new Date();
      const sellResult = await tx.caseOpening.updateMany({
        where: {
          id: opening.id,
          userId,
          status: CaseOpeningStatus.OWNED,
        },
        data: {
          status: CaseOpeningStatus.SOLD,
          soldAmountTon: opening.giftType.estimatedValueTon,
          soldAt,
        },
      });

      if (sellResult.count !== 1) {
        throw new BadRequestException('This inventory item is no longer available');
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          balanceTon: {
            increment: opening.giftType.estimatedValueTon,
          },
        },
        select: {
          balanceTon: true,
        },
      });

      await tx.balanceTransaction.create({
        data: {
          userId,
          type: BalanceTransactionType.INVENTORY_SALE,
          amountTon: opening.giftType.estimatedValueTon,
          balanceAfterTon: updatedUser.balanceTon,
          referenceType: 'inventory_item',
          referenceId: opening.id,
          note: `Sold ${opening.giftType.name}`,
        },
      });

      await this.auditService.write(
        {
          ...auditContext,
          userId,
          action: 'inventory.sell',
          entityType: 'case_opening',
          entityId: opening.id,
          metadata: {
            giftTypeId: opening.giftType.id,
            amountTon: opening.giftType.estimatedValueTon,
            balanceAfterTon: updatedUser.balanceTon,
          },
        },
        tx,
      );

      const refreshedOpening = await tx.caseOpening.findUnique({
        where: { id: opening.id },
        include: {
          case: true,
          giftType: true,
        },
      });

      if (!refreshedOpening) {
        throw new NotFoundException('Inventory item not found');
      }

      return refreshedOpening;
    });

    return this.mapInventoryItem(updatedOpening);
  }

  async requestWithdrawInventoryItem(
    userId: string,
    openingId: string,
    auditContext: AuditContext,
  ) {
    const opening = await this.prisma.caseOpening.findFirst({
      where: {
        id: openingId,
        userId,
      },
      include: {
        case: true,
        giftType: true,
      },
    });

    if (!opening) {
      throw new NotFoundException('Inventory item not found');
    }

    if (opening.status !== CaseOpeningStatus.OWNED) {
      throw new BadRequestException('Only owned items can be withdrawn');
    }

    const updatedOpening = await this.prisma.$transaction(async (tx) => {
      const withdrawalRequestedAt = new Date();
      const requestResult = await tx.caseOpening.updateMany({
        where: {
          id: opening.id,
          userId,
          status: CaseOpeningStatus.OWNED,
        },
        data: {
          status: CaseOpeningStatus.WITHDRAW_PENDING,
          withdrawalRequestedAt,
        },
      });

      if (requestResult.count !== 1) {
        throw new BadRequestException('This inventory item is no longer available');
      }

      await tx.giftPurchaseRequest.upsert({
        where: {
          openingId: opening.id,
        },
        update: {
          userId,
          giftTypeId: opening.giftType.id,
          status: GiftPurchaseStatus.QUEUED,
          searchQuery: opening.giftType.name,
          providerKey: null,
          providerLabel: null,
          externalListingId: null,
          externalListingUrl: null,
          externalOrderId: null,
          quotedPriceTon: null,
          purchasedPriceTon: null,
          deliveryTelegramGiftId: null,
          failureReason: null,
          cancelledAt: null,
          searchStartedAt: null,
          offerFoundAt: null,
          purchasedAt: null,
          deliveredAt: null,
        },
        create: {
          userId,
          openingId: opening.id,
          giftTypeId: opening.giftType.id,
          status: GiftPurchaseStatus.QUEUED,
          searchQuery: opening.giftType.name,
        },
      });

      await this.auditService.write(
        {
          ...auditContext,
          userId,
          action: 'inventory.withdraw_request',
          entityType: 'case_opening',
          entityId: opening.id,
          metadata: {
            giftTypeId: opening.giftType.id,
            purchaseQueueStatus: 'queued',
          },
        },
        tx,
      );

      const refreshedOpening = await tx.caseOpening.findUnique({
        where: { id: opening.id },
        include: {
          case: true,
          giftType: true,
        },
      });

      if (!refreshedOpening) {
        throw new NotFoundException('Inventory item not found');
      }

      return refreshedOpening;
    });

    return this.mapInventoryItem(updatedOpening);
  }

  private mapInventoryItem(opening: CaseOpeningRecord) {
    return {
      id: opening.id,
      status: opening.status.toLowerCase(),
      telegramOwnedGiftId: opening.telegramOwnedGiftId,
      withdrawFailureReason: opening.withdrawFailureReason,
      soldAmountTon: opening.soldAmountTon,
      soldAt: opening.soldAt,
      withdrawalRequestedAt: opening.withdrawalRequestedAt,
      withdrawnAt: opening.withdrawnAt,
      createdAt: opening.createdAt,
      case: {
        id: opening.case.id,
        slug: opening.case.slug,
        name: opening.case.name,
        priceTon: opening.case.priceTon,
        image: opening.case.image,
        badgeGradient: opening.case.badgeGradient,
      },
      reward: {
        id: opening.giftType.id,
        telegramGiftTypeId: opening.giftType.telegramGiftTypeId,
        name: opening.giftType.name,
        image: opening.giftType.image,
        estimatedValueTon: opening.giftType.estimatedValueTon,
        rarity: opening.giftType.rarity.toLowerCase(),
        valueLabel: opening.giftType.valueLabel,
        accent: opening.giftType.accent,
        textColor: opening.giftType.textColor,
      },
    };
  }

  private mapHistoryEntry(opening: CaseOpeningRecord) {
    return {
      id: opening.id,
      status: opening.status.toLowerCase(),
      createdAt: opening.createdAt,
      soldAmountTon: opening.soldAmountTon,
      case: {
        slug: opening.case.slug,
        name: opening.case.name,
        image: opening.case.image,
      },
      reward: {
        id: opening.giftType.id,
        name: opening.giftType.name,
        image: opening.giftType.image,
        estimatedValueTon: opening.giftType.estimatedValueTon,
        rarity: opening.giftType.rarity.toLowerCase(),
      },
    };
  }
}
