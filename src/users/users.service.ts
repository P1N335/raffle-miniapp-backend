import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CaseOpeningStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type CaseOpeningRecord = Prisma.CaseOpeningGetPayload<{
  include: {
    case: true;
    giftType: true;
  };
}>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createMockUser() {
    return this.prisma.user.create({
      data: {
        telegramId: Date.now().toString(),
        username: `user_${Math.floor(Math.random() * 10000)}`,
        firstName: 'Test',
        lastName: 'User',
      },
    });
  }

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

  async sellInventoryItem(userId: string, openingId: string) {
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

    const updatedOpening = await this.prisma.caseOpening.update({
      where: { id: opening.id },
      data: {
        status: CaseOpeningStatus.SOLD,
        soldAmountTon: opening.giftType.estimatedValueTon,
        soldAt: new Date(),
      },
      include: {
        case: true,
        giftType: true,
      },
    });

    return this.mapInventoryItem(updatedOpening);
  }

  async requestWithdrawInventoryItem(userId: string, openingId: string) {
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

    const updatedOpening = await this.prisma.caseOpening.update({
      where: { id: opening.id },
      data: {
        status: CaseOpeningStatus.WITHDRAW_PENDING,
        withdrawalRequestedAt: new Date(),
      },
      include: {
        case: true,
        giftType: true,
      },
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
