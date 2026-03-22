import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
}