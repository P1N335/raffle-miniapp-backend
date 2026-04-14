import { Controller, Get, Param, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Post('mock')
  async createMockUser() {
    return this.usersService.createMockUser();
  }

  @Get(':userId/profile')
  async getProfile(@Param('userId') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Get(':userId/inventory/:openingId')
  async getInventoryItem(
    @Param('userId') userId: string,
    @Param('openingId') openingId: string,
  ) {
    return this.usersService.getInventoryItem(userId, openingId);
  }

  @Post(':userId/inventory/:openingId/sell')
  async sellInventoryItem(
    @Param('userId') userId: string,
    @Param('openingId') openingId: string,
  ) {
    return this.usersService.sellInventoryItem(userId, openingId);
  }

  @Post(':userId/inventory/:openingId/withdraw')
  async requestWithdrawInventoryItem(
    @Param('userId') userId: string,
    @Param('openingId') openingId: string,
  ) {
    return this.usersService.requestWithdrawInventoryItem(userId, openingId);
  }
}
