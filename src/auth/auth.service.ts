import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parse, validate } from '@tma.js/init-data-node';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async authWithTelegram(initDataRaw: string) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      throw new BadRequestException('TELEGRAM_BOT_TOKEN is not configured');
    }

    try {
      validate(initDataRaw, botToken);
    } catch {
      throw new UnauthorizedException('Invalid Telegram initData');
    }

    const initData = parse(initDataRaw);

    if (!initData.user) {
      throw new BadRequestException('Telegram user not found in initData');
    }

    const tgUser = initData.user;

    const username =
      typeof tgUser.username === 'string' ? tgUser.username : null;

    const firstName =
      typeof tgUser.firstName === 'string' ? tgUser.firstName : null;

    const lastName =
      typeof tgUser.lastName === 'string' ? tgUser.lastName : null;

    const photoUrl =
      typeof tgUser.photoUrl === 'string' ? tgUser.photoUrl : null;

    const user = await this.prisma.user.upsert({
      where: {
        telegramId: String(tgUser.id),
      },
      update: {
        username,
        firstName,
        lastName,
        photoUrl,
      },
      create: {
        telegramId: String(tgUser.id),
        username,
        firstName,
        lastName,
        photoUrl,
      },
    });

    return {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.photoUrl,
    };
  }

  async getMeByTelegramId(telegramId: string) {
    return this.prisma.user.findUnique({
      where: { telegramId },
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
      },
    });
  }
}