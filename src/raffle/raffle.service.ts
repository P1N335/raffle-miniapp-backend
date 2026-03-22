import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JoinRaffleDto } from './dto/join-raffle.dto';
import { RaffleStatus } from '@prisma/client';

@Injectable()
export class RaffleService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveRound() {
    let round = await this.prisma.raffleRound.findFirst({
      where: {
        status: RaffleStatus.BETTING,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        entries: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!round) {
      round = await this.prisma.raffleRound.create({
        data: {
          status: RaffleStatus.BETTING,
          bettingEndsAt: new Date(Date.now() + 60 * 1000),
          totalPool: 0,
        },
        include: {
          entries: {
            include: {
              user: true,
            },
          },
        },
      });
    }

    return this.mapRound(round);
  }

  async join(dto: JoinRaffleDto) {
    const round = await this.prisma.raffleRound.findFirst({
      where: {
        status: RaffleStatus.BETTING,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!round) {
      throw new NotFoundException('No active raffle round found');
    }

    if (round.bettingEndsAt.getTime() <= Date.now()) {
      throw new BadRequestException('Betting phase is over');
    }

    await this.prisma.$transaction([
      this.prisma.raffleEntry.create({
        data: {
          roundId: round.id,
          userId: dto.userId,
          amount: dto.amount,
        },
      }),
      this.prisma.raffleRound.update({
        where: {
          id: round.id,
        },
        data: {
          totalPool: {
            increment: dto.amount,
          },
        },
      }),
    ]);

    const updatedRound = await this.prisma.raffleRound.findUnique({
      where: {
        id: round.id,
      },
      include: {
        entries: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!updatedRound) {
      throw new NotFoundException('Updated raffle round not found');
    }

    return this.mapRound(updatedRound);
  }

  private mapRound(round: {
    id: string;
    status: RaffleStatus;
    startedAt: Date;
    bettingEndsAt: Date;
    spinningEndsAt: Date | null;
    finishedAt: Date | null;
    totalPool: number;
    winnerUserId: string | null;
    createdAt: Date;
    updatedAt: Date;
    entries: Array<{
      id: string;
      amount: number;
      createdAt: Date;
      user: {
        id: string;
        username: string | null;
        firstName: string | null;
      };
    }>;
  }) {
    const totalPool = round.totalPool || 0;

    return {
      id: round.id,
      status: round.status,
      startedAt: round.startedAt,
      bettingEndsAt: round.bettingEndsAt,
      spinningEndsAt: round.spinningEndsAt,
      finishedAt: round.finishedAt,
      totalPool,
      entries: round.entries.map((entry) => ({
        id: entry.id,
        userId: entry.user.id,
        username: entry.user.username ?? entry.user.firstName ?? 'Unknown',
        amount: entry.amount,
        chancePercent:
          totalPool > 0 ? Number(((entry.amount / totalPool) * 100).toFixed(2)) : 0,
        createdAt: entry.createdAt,
      })),
    };
  }
}