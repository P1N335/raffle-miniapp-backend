import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async authWithTelegram(initData: string) {
    const params = new URLSearchParams(initData);
    const userRaw = params.get('user');

    if (!userRaw) {
      throw new BadRequestException('Telegram user not found in initData');
    }

    let telegramUser: {
      id: number;
      username?: string;
      first_name?: string;
      last_name?: string;
      photo_url?: string;
    };

    try {
      telegramUser = JSON.parse(userRaw);
    } catch {
      throw new BadRequestException('Invalid Telegram user payload');
    }

    return this.prisma.user.upsert({
      where: {
        telegramId: telegramUser.id.toString(),
      },
      update: {
        username: telegramUser.username ?? null,
        firstName: telegramUser.first_name ?? null,
        lastName: telegramUser.last_name ?? null,
        photoUrl: telegramUser.photo_url ?? null,
      },
      create: {
        telegramId: telegramUser.id.toString(),
        username: telegramUser.username ?? null,
        firstName: telegramUser.first_name ?? null,
        lastName: telegramUser.last_name ?? null,
        photoUrl: telegramUser.photo_url ?? null,
      },
    });
  }

  async getMeByTelegramId(telegramId: string) {
    return this.prisma.user.findUnique({
      where: {
        telegramId,
      },
    });
  }
}