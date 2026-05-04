import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import {
  CaseOpeningStatus,
  CoinflipRoomStatus,
  CoinflipSeat,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { AuditContext } from '../audit/audit.types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCoinflipRoomDto } from './dto/create-coinflip-room.dto';
import { JoinCoinflipRoomDto } from './dto/join-coinflip-room.dto';

const CREATOR_CHANCE_MIN = 48;
const CREATOR_CHANCE_MAX = 52;
const MAX_SELECTED_GIFTS = 3;

const playerSelect = {
  id: true,
  telegramId: true,
  username: true,
  firstName: true,
  lastName: true,
  photoUrl: true,
} satisfies Prisma.UserSelect;

const roomPayload = Prisma.validator<Prisma.CoinflipRoomDefaultArgs>()({
  include: {
    creator: {
      select: playerSelect,
    },
    opponent: {
      select: playerSelect,
    },
    winner: {
      select: playerSelect,
    },
    items: {
      include: {
        user: {
          select: playerSelect,
        },
        opening: {
          select: {
            id: true,
            createdAt: true,
            case: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
          },
        },
        giftType: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    },
  },
});

type CoinflipRoomRecord = Prisma.CoinflipRoomGetPayload<typeof roomPayload>;
type SelectedOpeningRecord = Prisma.CaseOpeningGetPayload<{
  include: {
    case: true;
    giftType: true;
  };
}>;
type PrismaClientLike = PrismaService | Prisma.TransactionClient;

@Injectable()
export class CoinflipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findOpenRooms() {
    const rooms = await this.prisma.coinflipRoom.findMany({
      where: {
        status: CoinflipRoomStatus.OPEN,
      },
      ...roomPayload,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return rooms.map((room) => this.mapRoomSummary(room));
  }

  async findRoom(roomId: string) {
    const room = await this.prisma.coinflipRoom.findUnique({
      where: {
        id: roomId,
      },
      ...roomPayload,
    });

    if (!room) {
      throw new NotFoundException('CoinFlip room not found');
    }

    return this.mapRoomDetail(room);
  }

  async createRoom(
    userId: string,
    dto: CreateCoinflipRoomDto,
    auditContext: AuditContext,
  ) {
    const openingIds = normalizeOpeningIds(dto.openingIds);

    if (openingIds.length === 0) {
      throw new BadRequestException('Choose at least one gift');
    }

    return this.prisma.$transaction(async (tx) => {
      await this.ensureUserExists(tx, userId);
      await this.ensureUserHasNoOpenRoom(tx, userId);

      const openings = await this.getSelectableOpenings(tx, userId, openingIds);
      const creatorTotalTon = sumOpeningValue(openings);

      const lockedItems = await tx.caseOpening.updateMany({
        where: {
          id: {
            in: openingIds,
          },
            userId,
            status: CaseOpeningStatus.OWNED,
          },
        data: {
          status: CaseOpeningStatus.IN_COINFLIP,
          soldAmountTon: null,
          soldAt: null,
          withdrawalRequestedAt: null,
          withdrawnAt: null,
          telegramOwnedGiftId: null,
          withdrawFailureReason: null,
        },
      });

      if (lockedItems.count !== openingIds.length) {
        throw new BadRequestException(
          'Some selected gifts were already used in another game',
        );
      }

      const roomCode = await this.generateRoomCode(tx);
      const room = await tx.coinflipRoom.create({
        data: {
          roomCode,
          creatorUserId: userId,
          creatorTotalTon,
          creatorReadyAt: new Date(),
        },
      });

      await tx.coinflipRoomItem.createMany({
        data: openings.map((opening) => ({
          roomId: room.id,
          userId,
          openingId: opening.id,
          giftTypeId: opening.giftTypeId,
          seat: CoinflipSeat.CREATOR,
          estimatedValueTon: opening.giftType.estimatedValueTon,
        })),
      });

      const createdRoom = await tx.coinflipRoom.findUnique({
        where: {
          id: room.id,
        },
        ...roomPayload,
      });

      if (!createdRoom) {
        throw new NotFoundException('CoinFlip room was not created');
      }

      await this.auditService.write(
        {
          ...auditContext,
          userId,
          action: 'coinflip.room.create',
          entityType: 'coinflip_room',
          entityId: room.id,
          metadata: {
            roomCode,
            creatorTotalTon,
            openingIds,
          },
        },
        tx,
      );

      return this.mapRoomDetail(createdRoom);
    });
  }

  async cancelRoom(roomId: string, userId: string, auditContext: AuditContext) {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureUserExists(tx, userId);
      await this.lockRoom(tx, roomId);

      const room = await tx.coinflipRoom.findUnique({
        where: {
          id: roomId,
        },
        ...roomPayload,
      });

      if (!room) {
        throw new NotFoundException('CoinFlip room not found');
      }

      if (room.creatorUserId !== userId) {
        throw new BadRequestException('Only the room creator can cancel this room');
      }

      if (room.status !== CoinflipRoomStatus.OPEN) {
        throw new BadRequestException('This room can no longer be cancelled');
      }

      const creatorOpeningIds = room.items
        .filter((item) => item.seat === CoinflipSeat.CREATOR)
        .map((item) => item.openingId);

      if (creatorOpeningIds.length > 0) {
        await tx.caseOpening.updateMany({
          where: {
            id: {
              in: creatorOpeningIds,
            },
          },
          data: {
            status: CaseOpeningStatus.OWNED,
          },
        });
      }

      const cancelledRoom = await tx.coinflipRoom.update({
        where: {
          id: roomId,
        },
        data: {
          status: CoinflipRoomStatus.CANCELLED,
          cancelledAt: new Date(),
        },
        ...roomPayload,
      });

      await this.auditService.write(
        {
          ...auditContext,
          userId,
          action: 'coinflip.room.cancel',
          entityType: 'coinflip_room',
          entityId: roomId,
          metadata: {
            roomCode: room.roomCode,
            returnedOpeningIds: creatorOpeningIds,
          },
        },
        tx,
      );

      return this.mapRoomDetail(cancelledRoom);
    });
  }

  async joinRoom(
    roomId: string,
    userId: string,
    dto: JoinCoinflipRoomDto,
    auditContext: AuditContext,
  ) {
    const openingIds = normalizeOpeningIds(dto.openingIds);

    if (openingIds.length === 0) {
      throw new BadRequestException('Choose at least one gift');
    }

    return this.prisma.$transaction(async (tx) => {
      await this.ensureUserExists(tx, userId);
      await this.lockRoom(tx, roomId);

      const room = await tx.coinflipRoom.findUnique({
        where: {
          id: roomId,
        },
        ...roomPayload,
      });

      if (!room) {
        throw new NotFoundException('CoinFlip room not found');
      }

      if (room.status !== CoinflipRoomStatus.OPEN) {
        throw new BadRequestException('This room is no longer available');
      }

      if (room.creatorUserId === userId) {
        throw new BadRequestException('You cannot join your own room');
      }

      await this.ensureUserHasNoOpenRoom(tx, userId);

      const openings = await this.getSelectableOpenings(tx, userId, openingIds);
      const opponentTotalTon = sumOpeningValue(openings);
      const joinRangeTon = calculateJoinRange(room.creatorTotalTon);

      if (
        opponentTotalTon < joinRangeTon.min ||
        opponentTotalTon > joinRangeTon.max
      ) {
        throw new BadRequestException(
          `Your gifts must total between ${joinRangeTon.min} and ${joinRangeTon.max} TON`,
        );
      }

      const lockedItems = await tx.caseOpening.updateMany({
        where: {
          id: {
            in: openingIds,
          },
            userId,
            status: CaseOpeningStatus.OWNED,
          },
        data: {
          status: CaseOpeningStatus.IN_COINFLIP,
          soldAmountTon: null,
          soldAt: null,
          withdrawalRequestedAt: null,
          withdrawnAt: null,
          telegramOwnedGiftId: null,
          withdrawFailureReason: null,
        },
      });

      if (lockedItems.count !== openingIds.length) {
        throw new BadRequestException(
          'Some selected gifts were already used in another game',
        );
      }

      await tx.coinflipRoomItem.createMany({
        data: openings.map((opening) => ({
          roomId: room.id,
          userId,
          openingId: opening.id,
          giftTypeId: opening.giftTypeId,
          seat: CoinflipSeat.OPPONENT,
          estimatedValueTon: opening.giftType.estimatedValueTon,
        })),
      });

      const totalPotTon = room.creatorTotalTon + opponentTotalTon;
      const creatorWins = randomInt(totalPotTon) < room.creatorTotalTon;
      const winnerUserId = creatorWins ? room.creatorUserId : userId;

      const creatorOpeningIds = room.items
        .filter((item) => item.seat === CoinflipSeat.CREATOR)
        .map((item) => item.openingId);

      const allOpeningIds = [...creatorOpeningIds, ...openingIds];

      await tx.caseOpening.updateMany({
        where: {
          id: {
            in: allOpeningIds,
          },
        },
        data: {
          userId: winnerUserId,
          status: CaseOpeningStatus.OWNED,
          soldAmountTon: null,
          soldAt: null,
          withdrawalRequestedAt: null,
          withdrawnAt: null,
          telegramOwnedGiftId: null,
          withdrawFailureReason: null,
        },
      });

      const finishedRoom = await tx.coinflipRoom.update({
        where: {
          id: room.id,
        },
        data: {
          opponentUserId: userId,
          opponentTotalTon,
          opponentReadyAt: new Date(),
          winnerUserId,
          status: CoinflipRoomStatus.FINISHED,
          finishedAt: new Date(),
        },
        ...roomPayload,
      });

      await this.auditService.write(
        {
          ...auditContext,
          userId,
          action: 'coinflip.room.join',
          entityType: 'coinflip_room',
          entityId: room.id,
          metadata: {
            roomCode: room.roomCode,
            creatorTotalTon: room.creatorTotalTon,
            opponentTotalTon,
            winnerUserId,
            openingIds,
          },
        },
        tx,
      );

      return this.mapRoomDetail(finishedRoom);
    });
  }

  private async ensureUserExists(client: PrismaClientLike, userId: string) {
    const user = await client.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  private async ensureUserHasNoOpenRoom(client: PrismaClientLike, userId: string) {
    const existingRoom = await client.coinflipRoom.findFirst({
      where: {
        creatorUserId: userId,
        status: CoinflipRoomStatus.OPEN,
      },
      select: {
        id: true,
      },
    });

    if (existingRoom) {
      throw new BadRequestException('Finish or cancel your open CoinFlip room first');
    }
  }

  private async lockRoom(client: Prisma.TransactionClient, roomId: string) {
    await client.$queryRaw`SELECT "id" FROM "CoinflipRoom" WHERE "id" = ${roomId} FOR UPDATE`;
  }

  private async getSelectableOpenings(
    client: PrismaClientLike,
    userId: string,
    openingIds: string[],
  ) {
    if (openingIds.length > MAX_SELECTED_GIFTS) {
      throw new BadRequestException('You can select up to 3 gifts');
    }

    const openings = await client.caseOpening.findMany({
      where: {
        id: {
          in: openingIds,
        },
        userId,
        status: CaseOpeningStatus.OWNED,
      },
      include: {
        case: true,
        giftType: true,
      },
    });

    if (openings.length !== openingIds.length) {
      throw new BadRequestException('Some selected gifts are unavailable');
    }

    return openingIds.map((openingId) => {
      const opening = openings.find((candidate) => candidate.id === openingId);

      if (!opening) {
        throw new BadRequestException('Some selected gifts are unavailable');
      }

      return opening;
    });
  }

  private async generateRoomCode(client: PrismaClientLike) {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const roomCode = `CF-${randomUUID().slice(0, 8).toUpperCase()}`;
      const existingRoom = await client.coinflipRoom.findUnique({
        where: {
          roomCode,
        },
        select: {
          id: true,
        },
      });

      if (!existingRoom) {
        return roomCode;
      }
    }

    throw new BadRequestException('Failed to generate a unique room code');
  }

  private mapRoomSummary(room: CoinflipRoomRecord) {
    const creatorItems = room.items.filter((item) => item.seat === CoinflipSeat.CREATOR);

    return {
      id: room.id,
      roomCode: room.roomCode,
      status: room.status.toLowerCase(),
      createdAt: room.createdAt,
      creatorTotalTon: room.creatorTotalTon,
      creatorGiftCount: creatorItems.length,
      creator: mapPlayer(room.creator),
      previewItems: creatorItems.slice(0, 3).map((item) => this.mapRoomItem(item)),
    };
  }

  private mapRoomDetail(room: CoinflipRoomRecord) {
    const creatorItems = room.items
      .filter((item) => item.seat === CoinflipSeat.CREATOR)
      .map((item) => this.mapRoomItem(item));
    const opponentItems = room.items
      .filter((item) => item.seat === CoinflipSeat.OPPONENT)
      .map((item) => this.mapRoomItem(item));
    const totalPotTon = room.creatorTotalTon + (room.opponentTotalTon ?? 0);
    const creatorChancePercent =
      room.opponentTotalTon && totalPotTon > 0
        ? toPercent(room.creatorTotalTon / totalPotTon)
        : null;
    const opponentChancePercent =
      room.opponentTotalTon && totalPotTon > 0
        ? toPercent(room.opponentTotalTon / totalPotTon)
        : null;

    return {
      id: room.id,
      roomCode: room.roomCode,
      status: room.status.toLowerCase(),
      createdAt: room.createdAt,
      creatorReadyAt: room.creatorReadyAt,
      opponentReadyAt: room.opponentReadyAt,
      finishedAt: room.finishedAt,
      cancelledAt: room.cancelledAt,
      creatorTotalTon: room.creatorTotalTon,
      opponentTotalTon: room.opponentTotalTon,
      totalPotTon,
      joinRangeTon: calculateJoinRange(room.creatorTotalTon),
      creatorChancePercent,
      opponentChancePercent,
      creator: mapPlayer(room.creator),
      opponent: room.opponent ? mapPlayer(room.opponent) : null,
      winner: room.winner ? mapPlayer(room.winner) : null,
      creatorItems,
      opponentItems,
    };
  }

  private mapRoomItem(item: CoinflipRoomRecord['items'][number]) {
    return {
      id: item.id,
      seat: item.seat.toLowerCase(),
      ownerUserId: item.userId,
      ownerName: mapPlayerName(item.user),
      openingId: item.openingId,
      estimatedValueTon: item.estimatedValueTon,
      sourceCase: {
        id: item.opening.case.id,
        slug: item.opening.case.slug,
        name: item.opening.case.name,
      },
      reward: {
        id: item.giftType.id,
        telegramGiftTypeId: item.giftType.telegramGiftTypeId,
        name: item.giftType.name,
        image: item.giftType.image,
        estimatedValueTon: item.giftType.estimatedValueTon,
        rarity: item.giftType.rarity.toLowerCase(),
        valueLabel: item.giftType.valueLabel,
        accent: item.giftType.accent,
        textColor: item.giftType.textColor,
      },
    };
  }
}

function normalizeOpeningIds(openingIds: string[]) {
  return Array.from(new Set(openingIds.map((openingId) => openingId.trim()).filter(Boolean)));
}

function sumOpeningValue(openings: SelectedOpeningRecord[]) {
  return openings.reduce(
    (total, opening) => total + opening.giftType.estimatedValueTon,
    0,
  );
}

function calculateJoinRange(creatorTotalTon: number) {
  return {
    min: Math.ceil((creatorTotalTon * CREATOR_CHANCE_MIN) / CREATOR_CHANCE_MAX),
    max: Math.floor((creatorTotalTon * CREATOR_CHANCE_MAX) / CREATOR_CHANCE_MIN),
  };
}

function toPercent(ratio: number) {
  return Number((ratio * 100).toFixed(2));
}

function mapPlayerName(player: {
  username: string | null;
  firstName: string | null;
  lastName: string | null;
}) {
  if (player.username) {
    return `@${player.username}`;
  }

  const fullName = [player.firstName, player.lastName].filter(Boolean).join(' ');

  return fullName || 'Player';
}

function mapPlayer(player: {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
}) {
  return {
    id: player.id,
    telegramId: player.telegramId,
    username: player.username,
    firstName: player.firstName,
    lastName: player.lastName,
    photoUrl: player.photoUrl,
    displayName: mapPlayerName(player),
  };
}
