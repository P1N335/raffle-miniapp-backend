import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CaseOpeningStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type WithdrawalRecord = Prisma.CaseOpeningGetPayload<{
  include: {
    user: true;
    case: true;
    giftType: true;
  };
}>;

@Injectable()
export class WithdrawalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPending(limit = 20) {
    const normalizedLimit = Number.isFinite(limit)
      ? Math.min(Math.max(limit, 1), 100)
      : 20;

    const openings = await this.prisma.caseOpening.findMany({
      where: {
        status: CaseOpeningStatus.WITHDRAW_PENDING,
      },
      include: {
        user: true,
        case: true,
        giftType: true,
      },
      orderBy: [
        {
          withdrawalRequestedAt: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
      take: normalizedLimit,
    });

    return openings.map((opening) => this.mapWithdrawalRequest(opening));
  }

  async findOne(openingId: string) {
    const opening = await this.prisma.caseOpening.findUnique({
      where: {
        id: openingId,
      },
      include: {
        user: true,
        case: true,
        giftType: true,
      },
    });

    if (!opening) {
      throw new NotFoundException('Withdrawal request not found');
    }

    return this.mapWithdrawalRequest(opening);
  }

  async complete(openingId: string, telegramOwnedGiftId?: string) {
    const opening = await this.prisma.caseOpening.findUnique({
      where: {
        id: openingId,
      },
      include: {
        user: true,
        case: true,
        giftType: true,
      },
    });

    if (!opening) {
      throw new NotFoundException('Withdrawal request not found');
    }

    if (opening.status === CaseOpeningStatus.WITHDRAWN) {
      return this.mapWithdrawalRequest(opening);
    }

    if (opening.status !== CaseOpeningStatus.WITHDRAW_PENDING) {
      throw new BadRequestException(
        'Only withdrawal requests in pending status can be completed',
      );
    }

    const updatedOpening = await this.prisma.caseOpening.update({
      where: {
        id: openingId,
      },
      data: {
        status: CaseOpeningStatus.WITHDRAWN,
        telegramOwnedGiftId: telegramOwnedGiftId ?? opening.telegramOwnedGiftId,
        withdrawFailureReason: null,
        withdrawnAt: new Date(),
      },
      include: {
        user: true,
        case: true,
        giftType: true,
      },
    });

    return this.mapWithdrawalRequest(updatedOpening);
  }

  async fail(openingId: string, reason: string) {
    const opening = await this.prisma.caseOpening.findUnique({
      where: {
        id: openingId,
      },
      include: {
        user: true,
        case: true,
        giftType: true,
      },
    });

    if (!opening) {
      throw new NotFoundException('Withdrawal request not found');
    }

    if (opening.status !== CaseOpeningStatus.WITHDRAW_PENDING) {
      throw new BadRequestException(
        'Only withdrawal requests in pending status can be rejected',
      );
    }

    const updatedOpening = await this.prisma.caseOpening.update({
      where: {
        id: openingId,
      },
      data: {
        status: CaseOpeningStatus.OWNED,
        withdrawFailureReason: reason,
        withdrawnAt: null,
        telegramOwnedGiftId: null,
      },
      include: {
        user: true,
        case: true,
        giftType: true,
      },
    });

    return this.mapWithdrawalRequest(updatedOpening);
  }

  private mapWithdrawalRequest(opening: WithdrawalRecord) {
    return {
      id: opening.id,
      status: opening.status.toLowerCase(),
      createdAt: opening.createdAt,
      withdrawalRequestedAt: opening.withdrawalRequestedAt,
      withdrawnAt: opening.withdrawnAt,
      telegramOwnedGiftId: opening.telegramOwnedGiftId,
      withdrawFailureReason: opening.withdrawFailureReason,
      user: opening.user
        ? {
            id: opening.user.id,
            telegramId: opening.user.telegramId,
            username: opening.user.username,
            firstName: opening.user.firstName,
            lastName: opening.user.lastName,
            photoUrl: opening.user.photoUrl,
          }
        : null,
      case: {
        id: opening.case.id,
        slug: opening.case.slug,
        name: opening.case.name,
        priceTon: opening.case.priceTon,
        image: opening.case.image,
      },
      reward: {
        id: opening.giftType.id,
        telegramGiftTypeId: opening.giftType.telegramGiftTypeId,
        name: opening.giftType.name,
        image: opening.giftType.image,
        rarity: opening.giftType.rarity.toLowerCase(),
        estimatedValueTon: opening.giftType.estimatedValueTon,
        valueLabel: opening.giftType.valueLabel,
      },
    };
  }
}
