import { Injectable, NotFoundException } from '@nestjs/common';
import { CaseRewardRarity } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CASE_CATALOG,
  CaseCatalogEntry,
  CaseCatalogReward,
  getCaseCatalogEntry,
} from './cases.catalog';

@Injectable()
export class CasesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return CASE_CATALOG.map((caseItem) => this.mapCase(caseItem));
  }

  findOne(slug: string) {
    const caseItem = getCaseCatalogEntry(slug);

    if (!caseItem) {
      throw new NotFoundException('Case not found');
    }

    return this.mapCase(caseItem);
  }

  async openCase(slug: string, userId?: string) {
    const caseItem = getCaseCatalogEntry(slug);

    if (!caseItem) {
      throw new NotFoundException('Case not found');
    }

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }
    }

    const reward = pickWeightedReward(caseItem.rewards);

    const opening = await this.prisma.caseOpening.create({
      data: {
        caseSlug: caseItem.slug,
        caseName: caseItem.name,
        priceTon: caseItem.priceTon,
        rewardId: reward.id,
        rewardName: reward.name,
        rewardImage: reward.image,
        rewardRarity: mapRewardRarity(reward.rarity),
        rewardChance: reward.chance,
        rewardValueLabel: reward.valueLabel,
        userId: userId ?? null,
      },
      select: {
        id: true,
        createdAt: true,
        userId: true,
      },
    });

    return {
      case: {
        slug: caseItem.slug,
        name: caseItem.name,
        priceTon: caseItem.priceTon,
      },
      reward: {
        id: reward.id,
        name: reward.name,
        image: reward.image,
        rarity: reward.rarity,
        chance: reward.chance,
        valueLabel: reward.valueLabel,
      },
      opening,
    };
  }

  async findOpenings(userId?: string, limit = 10) {
    const openings = await this.prisma.caseOpening.findMany({
      where: userId ? { userId } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(Math.max(limit, 1), 50),
      select: {
        id: true,
        caseSlug: true,
        caseName: true,
        priceTon: true,
        rewardId: true,
        rewardName: true,
        rewardImage: true,
        rewardRarity: true,
        rewardChance: true,
        rewardValueLabel: true,
        userId: true,
        createdAt: true,
      },
    });

    return openings.map((opening) => ({
      ...opening,
      rewardRarity: opening.rewardRarity.toLowerCase(),
    }));
  }

  private mapCase(caseItem: CaseCatalogEntry) {
    return {
      slug: caseItem.slug,
      name: caseItem.name,
      tagline: caseItem.tagline,
      shortDescription: caseItem.shortDescription,
      priceTon: caseItem.priceTon,
      image: caseItem.image,
      rewards: caseItem.rewards,
    };
  }
}

function pickWeightedReward(rewards: CaseCatalogReward[]) {
  const totalChance = rewards.reduce((sum, reward) => sum + reward.chance, 0);
  let random = Math.random() * totalChance;

  for (const reward of rewards) {
    random -= reward.chance;
    if (random <= 0) {
      return reward;
    }
  }

  return rewards[rewards.length - 1];
}

function mapRewardRarity(rarity: CaseCatalogReward['rarity']) {
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
