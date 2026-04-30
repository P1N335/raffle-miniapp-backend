import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  CasePaymentStatus,
  CasePaymentSource,
  CaseRewardRarity,
  Prisma,
  TonNetwork,
} from '@prisma/client';
import { Address, beginCell, Cell } from '@ton/core';
import { PrismaService } from '../prisma/prisma.service';
import { CASE_CATALOG, GIFT_TYPE_CATALOG } from './cases.catalog';

const TONCENTER_DEFAULT_BASE_URL = 'https://toncenter.com/api';
const TON_NANO = 1_000_000_000n;
const PAYMENT_VALIDITY_SECONDS = 300;
const PAYMENT_EXPIRY_GRACE_SECONDS = 900;

type CaseRecord = Prisma.CaseDefinitionGetPayload<{
  include: {
    drops: {
      include: {
        giftType: true;
      };
    };
  };
}>;

type PaymentIntentRecord = Prisma.CasePaymentIntentGetPayload<{
  include: {
    opening: {
      include: {
        case: true;
        caseDrop: {
          include: {
            giftType: true;
          };
        };
        giftType: true;
      };
    };
  };
}>;

@Injectable()
export class CasesService implements OnModuleInit {
  private readonly logger = new Logger(CasesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.syncCatalog();
  }

  async findAll() {
    const cases = await this.prisma.caseDefinition.findMany({
      where: {
        isActive: true,
      },
      include: {
        drops: {
          include: {
            giftType: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return cases.map((caseItem) => this.mapCaseRecord(caseItem));
  }

  async findOne(slug: string) {
    const caseItem = await this.prisma.caseDefinition.findUnique({
      where: { slug },
      include: {
        drops: {
          include: {
            giftType: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    if (!caseItem || !caseItem.isActive) {
      throw new NotFoundException('Case not found');
    }

    return this.mapCaseRecord(caseItem);
  }

  async createPaymentIntent(
    slug: string,
    userId: string | undefined,
    walletAddress: string,
  ) {
    const caseItem = await this.prisma.caseDefinition.findUnique({
      where: { slug },
    });

    if (!caseItem || !caseItem.isActive) {
      throw new NotFoundException('Case not found');
    }

    const normalizedWallet = this.normalizeAddress(walletAddress);
    const recipientAddress = this.getRecipientAddressOrThrow();
    const validUntil = new Date(Date.now() + PAYMENT_VALIDITY_SECONDS * 1000);
    const amountNano = (BigInt(caseItem.priceTon) * TON_NANO).toString();
    const paymentIntentId = randomUUID();
    const reference = `casepay:${paymentIntentId}`;

    let resolvedUserId: string | null = null;

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const existingWalletOwner = await this.prisma.user.findFirst({
        where: {
          tonWalletAddressRaw: normalizedWallet.raw,
          NOT: {
            id: userId,
          },
        },
        select: {
          id: true,
        },
      });

      if (existingWalletOwner) {
        throw new BadRequestException(
          'This TON wallet is already linked to another user',
        );
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          tonWalletAddress: normalizedWallet.userFriendly,
          tonWalletAddressRaw: normalizedWallet.raw,
          tonWalletNetwork: this.getTonNetwork(),
          tonWalletConnectedAt: new Date(),
        },
      });

      resolvedUserId = userId;
    }

    const paymentIntent = await this.prisma.casePaymentIntent.create({
      data: {
        id: paymentIntentId,
        userId: resolvedUserId,
        caseId: caseItem.id,
        caseSlug: caseItem.slug,
        caseName: caseItem.name,
        paymentSource: CasePaymentSource.TON_WALLET,
        walletAddress: normalizedWallet.userFriendly,
        walletAddressRaw: normalizedWallet.raw,
        recipientAddress: recipientAddress.userFriendly,
        recipientAddressRaw: recipientAddress.raw,
        amountTon: caseItem.priceTon,
        amountNano,
        reference,
        validUntil,
      },
    });

    return {
      paymentIntent: this.mapPaymentIntent(paymentIntent),
      transaction: {
        validUntil: Math.floor(validUntil.getTime() / 1000),
        messages: [
          {
            address: recipientAddress.userFriendly,
            amount: amountNano,
            payload: this.buildPaymentPayload(reference),
          },
        ],
      },
    };
  }

  async openWithBalance(slug: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const caseItem = await tx.caseDefinition.findUnique({
        where: { slug },
        include: {
          drops: {
            include: {
              giftType: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
          },
        },
      });

      if (!caseItem || !caseItem.isActive) {
        throw new NotFoundException('Case not found');
      }

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          balanceTon: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.balanceTon < caseItem.priceTon) {
        throw new BadRequestException(
          `You need at least ${caseItem.priceTon} TON on your internal balance`,
        );
      }

      if (caseItem.drops.length === 0) {
        throw new InternalServerErrorException(
          'Case catalog is not ready for opening',
        );
      }

      const amountNano = (BigInt(caseItem.priceTon) * TON_NANO).toString();
      const paymentIntentId = randomUUID();
      const reference = `balance:${paymentIntentId}`;
      const winningDrop = pickWeightedDrop(caseItem.drops);

      await tx.user.update({
        where: { id: userId },
        data: {
          balanceTon: {
            decrement: caseItem.priceTon,
          },
        },
      });

      await tx.casePaymentIntent.create({
        data: {
          id: paymentIntentId,
          userId,
          caseId: caseItem.id,
          caseSlug: caseItem.slug,
          caseName: caseItem.name,
          paymentSource: CasePaymentSource.INTERNAL_BALANCE,
          walletAddress: 'internal-balance',
          walletAddressRaw: `internal-balance:${userId}`,
          recipientAddress: 'internal-balance',
          recipientAddressRaw: 'internal-balance',
          amountTon: caseItem.priceTon,
          amountNano,
          reference,
          status: CasePaymentStatus.CONFIRMED,
          validUntil: new Date(),
          confirmedAt: new Date(),
        },
      });

      const opening = await tx.caseOpening.create({
        data: {
          userId,
          caseId: caseItem.id,
          caseDropId: winningDrop.id,
          giftTypeId: winningDrop.giftType.id,
          paymentIntentId,
        },
      });

      const updatedUser = await tx.user.findUnique({
        where: { id: userId },
        select: {
          balanceTon: true,
        },
      });

      return {
        paymentIntent: {
          id: paymentIntentId,
          caseId: caseItem.id,
          caseSlug: caseItem.slug,
          caseName: caseItem.name,
          paymentSource: 'internal_balance',
          walletAddress: 'internal-balance',
          recipientAddress: 'internal-balance',
          amountTon: caseItem.priceTon,
          amountNano,
          reference,
          status: 'confirmed',
          validUntil: new Date(),
          confirmedAt: new Date(),
          createdAt: new Date(),
        },
        opening: {
          id: opening.id,
          userId,
          createdAt: opening.createdAt,
          caseId: caseItem.id,
          caseDropId: winningDrop.id,
          giftTypeId: winningDrop.giftType.id,
        },
        case: {
          id: caseItem.id,
          slug: caseItem.slug,
          name: caseItem.name,
          priceTon: caseItem.priceTon,
          image: caseItem.image,
          badgeGradient: caseItem.badgeGradient,
          buttonGradient: caseItem.buttonGradient,
          surfaceTint: caseItem.surfaceTint,
        },
        reward: this.mapRewardDrop(winningDrop),
        balanceTon: updatedUser?.balanceTon ?? 0,
      };
    });
  }

  async submitPaymentIntent(intentId: string, boc?: string) {
    const paymentIntent = await this.prisma.casePaymentIntent.findUnique({
      where: { id: intentId },
    });

    if (!paymentIntent) {
      throw new NotFoundException('Payment intent not found');
    }

    if (paymentIntent.status === CasePaymentStatus.CONFIRMED) {
      return {
        paymentIntent: this.mapPaymentIntent(paymentIntent),
      };
    }

    const updatedIntent = await this.prisma.casePaymentIntent.update({
      where: { id: intentId },
      data: {
        status: CasePaymentStatus.SUBMITTED,
        submittedBoc: boc ?? paymentIntent.submittedBoc,
      },
    });

    return {
      paymentIntent: this.mapPaymentIntent(updatedIntent),
    };
  }

  async getPaymentIntentStatus(intentId: string) {
    const paymentIntent = await this.prisma.casePaymentIntent.findUnique({
      where: { id: intentId },
      include: {
        opening: {
          include: {
            case: true,
            caseDrop: {
              include: {
                giftType: true,
              },
            },
            giftType: true,
          },
        },
      },
    });

    if (!paymentIntent) {
      throw new NotFoundException('Payment intent not found');
    }

    const resolvedIntent = await this.resolvePaymentIntent(paymentIntent);

    return this.mapPaymentIntentStatusResponse(resolvedIntent);
  }

  async findOpenings(userId?: string, limit = 10) {
    const openings = await this.prisma.caseOpening.findMany({
      where: userId ? { userId } : undefined,
      include: {
        case: true,
        caseDrop: {
          include: {
            giftType: true,
          },
        },
        giftType: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(Math.max(limit, 1), 50),
    });

    return openings.map((opening) => ({
      id: opening.id,
      userId: opening.userId,
      createdAt: opening.createdAt,
      paymentIntentId: opening.paymentIntentId,
      case: {
        id: opening.case.id,
        slug: opening.case.slug,
        name: opening.case.name,
        priceTon: opening.case.priceTon,
      },
      reward: this.mapRewardDrop(opening.caseDrop),
    }));
  }

  async getWalletBalance(address: string) {
    const normalizedAddress = this.normalizeAddress(address);
    const url = new URL('/api/v2/getAddressBalance', this.getTonCenterOrigin());
    url.searchParams.set('address', normalizedAddress.userFriendly);

    const response = await fetch(url, {
      headers: this.getTonCenterHeaders(),
    });

    if (!response.ok) {
      throw new InternalServerErrorException('Failed to load TON wallet balance');
    }

    const payload = (await response.json()) as {
      ok?: boolean;
      result?: string;
      error?: string;
    };

    if (!payload.ok || !payload.result) {
      throw new InternalServerErrorException(
        payload.error || 'Failed to load TON wallet balance',
      );
    }

    return {
      address: normalizedAddress.userFriendly,
      addressRaw: normalizedAddress.raw,
      network: this.getTonNetwork().toLowerCase(),
      balanceNano: payload.result,
      balanceTon: formatTonAmount(payload.result),
    };
  }

  private async resolvePaymentIntent(paymentIntent: PaymentIntentRecord) {
    if (paymentIntent.opening) {
      return paymentIntent;
    }

    if (
      paymentIntent.status === CasePaymentStatus.EXPIRED ||
      paymentIntent.status === CasePaymentStatus.FAILED
    ) {
      return paymentIntent;
    }

    const expirationTime =
      paymentIntent.validUntil.getTime() + PAYMENT_EXPIRY_GRACE_SECONDS * 1000;

    if (Date.now() > expirationTime) {
      await this.prisma.casePaymentIntent.update({
        where: { id: paymentIntent.id },
        data: {
          status: CasePaymentStatus.EXPIRED,
        },
      });

      return {
        ...paymentIntent,
        status: CasePaymentStatus.EXPIRED,
      };
    }

    try {
      const matchingTransaction = await this.findMatchingTransaction(paymentIntent);

      if (!matchingTransaction) {
        return paymentIntent;
      }

      await this.prisma.casePaymentIntent.update({
        where: { id: paymentIntent.id },
        data: {
          status: CasePaymentStatus.CONFIRMED,
          transactionHash: matchingTransaction.hash ?? null,
          transactionLt: matchingTransaction.lt ?? null,
          confirmedAt: new Date(),
        },
      });

      const existingOpening = await this.prisma.caseOpening.findUnique({
        where: {
          paymentIntentId: paymentIntent.id,
        },
      });

      if (!existingOpening) {
        const caseItem = await this.prisma.caseDefinition.findUnique({
          where: { id: paymentIntent.caseId },
          include: {
            drops: {
              include: {
                giftType: true,
              },
              orderBy: {
                sortOrder: 'asc',
              },
            },
          },
        });

        if (!caseItem || caseItem.drops.length === 0) {
          throw new InternalServerErrorException(
            'Case catalog is not ready for opening',
          );
        }

        const winningDrop = pickWeightedDrop(caseItem.drops);

        await this.prisma.caseOpening.create({
          data: {
            userId: paymentIntent.userId,
            caseId: caseItem.id,
            caseDropId: winningDrop.id,
            giftTypeId: winningDrop.giftType.id,
            paymentIntentId: paymentIntent.id,
          },
        });
      }
    } catch (error) {
      this.logger.warn(
        `TON payment verification for ${paymentIntent.id} failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }

    const refreshedIntent = await this.prisma.casePaymentIntent.findUnique({
      where: { id: paymentIntent.id },
      include: {
        opening: {
          include: {
            case: true,
            caseDrop: {
              include: {
                giftType: true,
              },
            },
            giftType: true,
          },
        },
      },
    });

    if (!refreshedIntent) {
      throw new NotFoundException('Payment intent not found');
    }

    return refreshedIntent;
  }

  private mapCaseRecord(caseItem: CaseRecord) {
    return {
      id: caseItem.id,
      slug: caseItem.slug,
      name: caseItem.name,
      tagline: caseItem.tagline,
      shortDescription: caseItem.shortDescription,
      priceTon: caseItem.priceTon,
      image: caseItem.image,
      badgeGradient: caseItem.badgeGradient,
      buttonGradient: caseItem.buttonGradient,
      surfaceTint: caseItem.surfaceTint,
      rewards: caseItem.drops.map((drop) => this.mapRewardDrop(drop)),
    };
  }

  private mapRewardDrop(drop: CaseRecord['drops'][number]) {
    return {
      id: drop.giftType.id,
      dropId: drop.id,
      telegramGiftTypeId: drop.giftType.telegramGiftTypeId,
      name: drop.giftType.name,
      image: drop.giftType.image,
      rarity: mapRewardRarityName(drop.giftType.rarity),
      chance: drop.chance,
      valueLabel: drop.giftType.valueLabel,
      estimatedValueTon: drop.giftType.estimatedValueTon,
      accent: drop.giftType.accent,
      textColor: drop.giftType.textColor,
    };
  }

  private mapPaymentIntent(
    paymentIntent: Prisma.CasePaymentIntentGetPayload<Record<string, never>>,
  ) {
    return {
      id: paymentIntent.id,
      caseId: paymentIntent.caseId,
      caseSlug: paymentIntent.caseSlug,
      caseName: paymentIntent.caseName,
      paymentSource: paymentIntent.paymentSource.toLowerCase(),
      walletAddress: paymentIntent.walletAddress,
      recipientAddress: paymentIntent.recipientAddress,
      amountTon: paymentIntent.amountTon,
      amountNano: paymentIntent.amountNano,
      reference: paymentIntent.reference,
      status: paymentIntent.status.toLowerCase(),
      validUntil: paymentIntent.validUntil,
      confirmedAt: paymentIntent.confirmedAt,
      createdAt: paymentIntent.createdAt,
    };
  }

  private mapPaymentIntentStatusResponse(paymentIntent: PaymentIntentRecord) {
    const base = {
      paymentIntent: this.mapPaymentIntent(paymentIntent),
    };

    if (!paymentIntent.opening) {
      return base;
    }

    return {
      ...base,
      opening: {
        id: paymentIntent.opening.id,
        userId: paymentIntent.opening.userId,
        createdAt: paymentIntent.opening.createdAt,
        caseId: paymentIntent.opening.caseId,
        caseDropId: paymentIntent.opening.caseDropId,
        giftTypeId: paymentIntent.opening.giftTypeId,
      },
      case: {
        id: paymentIntent.opening.case.id,
        slug: paymentIntent.opening.case.slug,
        name: paymentIntent.opening.case.name,
        priceTon: paymentIntent.opening.case.priceTon,
        image: paymentIntent.opening.case.image,
        badgeGradient: paymentIntent.opening.case.badgeGradient,
        buttonGradient: paymentIntent.opening.case.buttonGradient,
        surfaceTint: paymentIntent.opening.case.surfaceTint,
      },
      reward: this.mapRewardDrop(paymentIntent.opening.caseDrop),
    };
  }

  private async syncCatalog() {
    for (const gift of GIFT_TYPE_CATALOG) {
      await this.prisma.giftType.upsert({
        where: { id: gift.id },
        update: {
          telegramGiftTypeId: gift.telegramGiftTypeId ?? null,
          name: gift.name,
          description: gift.description ?? null,
          image: gift.image,
          rarity: mapRewardRarity(gift.rarity),
          estimatedValueTon: gift.estimatedValueTon,
          valueLabel: gift.valueLabel,
          accent: gift.accent,
          textColor: gift.textColor,
          isActive: true,
        },
        create: {
          id: gift.id,
          telegramGiftTypeId: gift.telegramGiftTypeId ?? null,
          name: gift.name,
          description: gift.description ?? null,
          image: gift.image,
          rarity: mapRewardRarity(gift.rarity),
          estimatedValueTon: gift.estimatedValueTon,
          valueLabel: gift.valueLabel,
          accent: gift.accent,
          textColor: gift.textColor,
          isActive: true,
        },
      });
    }

    for (const caseItem of CASE_CATALOG) {
      await this.prisma.caseDefinition.upsert({
        where: { id: caseItem.id },
        update: {
          slug: caseItem.slug,
          name: caseItem.name,
          tagline: caseItem.tagline,
          shortDescription: caseItem.shortDescription,
          priceTon: caseItem.priceTon,
          image: caseItem.image,
          badgeGradient: caseItem.badgeGradient,
          buttonGradient: caseItem.buttonGradient,
          surfaceTint: caseItem.surfaceTint,
          sortOrder: caseItem.sortOrder,
          isActive: true,
        },
        create: {
          id: caseItem.id,
          slug: caseItem.slug,
          name: caseItem.name,
          tagline: caseItem.tagline,
          shortDescription: caseItem.shortDescription,
          priceTon: caseItem.priceTon,
          image: caseItem.image,
          badgeGradient: caseItem.badgeGradient,
          buttonGradient: caseItem.buttonGradient,
          surfaceTint: caseItem.surfaceTint,
          sortOrder: caseItem.sortOrder,
          isActive: true,
        },
      });

      for (const drop of caseItem.drops) {
        await this.prisma.caseDrop.upsert({
          where: { id: drop.id },
          update: {
            caseId: caseItem.id,
            giftTypeId: drop.giftTypeId,
            chance: drop.chance,
            sortOrder: drop.sortOrder,
          },
          create: {
            id: drop.id,
            caseId: caseItem.id,
            giftTypeId: drop.giftTypeId,
            chance: drop.chance,
            sortOrder: drop.sortOrder,
          },
        });
      }
    }
  }

  private buildPaymentPayload(reference: string) {
    return beginCell()
      .storeUint(0, 32)
      .storeStringTail(reference)
      .endCell()
      .toBoc()
      .toString('base64');
  }

  private async findMatchingTransaction(paymentIntent: PaymentIntentRecord) {
    const url = new URL('/api/v3/transactions', this.getTonCenterOrigin());
    url.searchParams.set('account', paymentIntent.recipientAddress);
    url.searchParams.set('limit', '25');
    url.searchParams.set(
      'start_utime',
      String(
        Math.max(
          Math.floor(paymentIntent.createdAt.getTime() / 1000) - 120,
          0,
        ),
      ),
    );
    url.searchParams.set('sort', 'desc');

    const response = await fetch(url, {
      headers: this.getTonCenterHeaders(),
    });

    if (!response.ok) {
      throw new Error(`TON Center verification failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      transactions?: TonCenterTransaction[];
    };

    const transactions = payload.transactions ?? [];

    return transactions.find((transaction) => {
      const inboundMessage = transaction.in_msg;

      if (!inboundMessage?.source || !inboundMessage.value) {
        return false;
      }

      let sourceRaw: string;

      try {
        sourceRaw = this.normalizeAddress(inboundMessage.source).raw;
      } catch {
        return false;
      }

      if (sourceRaw !== paymentIntent.walletAddressRaw) {
        return false;
      }

      if (BigInt(inboundMessage.value) < BigInt(paymentIntent.amountNano)) {
        return false;
      }

      const comment = this.parseTransactionComment(
        inboundMessage.message_content?.body,
      );

      return comment === paymentIntent.reference;
    });
  }

  private parseTransactionComment(body?: string | null) {
    if (!body) {
      return null;
    }

    try {
      const slice = Cell.fromBase64(body).beginParse();

      if (slice.remainingBits < 32) {
        return null;
      }

      const opcode = slice.loadUint(32);

      if (opcode !== 0) {
        return null;
      }

      return slice.loadStringTail();
    } catch {
      return null;
    }
  }

  private normalizeAddress(address: string) {
    try {
      const parsed = Address.parse(address);
      const testOnly = this.getTonNetwork() === TonNetwork.TESTNET;

      return {
        raw: parsed.toRawString(),
        userFriendly: parsed.toString({
          urlSafe: true,
          bounceable: false,
          testOnly,
        }),
      };
    } catch {
      throw new BadRequestException('Invalid TON wallet address');
    }
  }

  private getRecipientAddressOrThrow() {
    const address = process.env.TON_RECIPIENT_ADDRESS?.trim();

    if (!address) {
      throw new BadRequestException('TON_RECIPIENT_ADDRESS is not configured');
    }

    return this.normalizeAddress(address);
  }

  private getTonNetwork() {
    return process.env.TON_NETWORK === 'testnet'
      ? TonNetwork.TESTNET
      : TonNetwork.MAINNET;
  }

  private getTonCenterOrigin() {
    return (
      process.env.TONCENTER_API_BASE_URL?.trim().replace(/\/+$/, '') ??
      TONCENTER_DEFAULT_BASE_URL
    );
  }

  private getTonCenterHeaders() {
    const apiKey = process.env.TONCENTER_API_KEY?.trim();

    return apiKey ? { 'X-API-Key': apiKey } : undefined;
  }
}

type TonCenterTransaction = {
  hash?: string;
  lt?: string;
  in_msg?: {
    source?: string | null;
    value?: string | null;
    message_content?: {
      body?: string | null;
    } | null;
  } | null;
};

function pickWeightedDrop(drops: CaseRecord['drops']) {
  const totalChance = drops.reduce((sum, drop) => sum + drop.chance, 0);
  let random = Math.random() * totalChance;

  for (const drop of drops) {
    random -= drop.chance;

    if (random <= 0) {
      return drop;
    }
  }

  return drops[drops.length - 1];
}

function mapRewardRarity(rarity: (typeof GIFT_TYPE_CATALOG)[number]['rarity']) {
  switch (rarity) {
    case 'common':
      return CaseRewardRarity.COMMON;
    case 'rare':
      return CaseRewardRarity.RARE;
    case 'epic':
      return CaseRewardRarity.EPIC;
    case 'legendary':
      return CaseRewardRarity.LEGENDARY;
  }
}

function mapRewardRarityName(rarity: CaseRewardRarity) {
  return rarity.toLowerCase() as Lowercase<CaseRewardRarity>;
}

function formatTonAmount(balanceNano: string) {
  const whole = BigInt(balanceNano) / TON_NANO;
  const fraction = BigInt(balanceNano) % TON_NANO;

  if (fraction === 0n) {
    return whole.toString();
  }

  return `${whole}.${fraction.toString().padStart(9, '0').replace(/0+$/, '')}`;
}
