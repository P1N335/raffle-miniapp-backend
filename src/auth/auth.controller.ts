import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthTelegramDto } from './dto/auth-telegram.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('telegram')
  async authTelegram(@Body() dto: AuthTelegramDto) {
    return this.authService.authWithTelegram(dto.initData);
  }

  @Get('me')
  async me(@Headers('x-telegram-id') telegramId?: string) {
    if (!telegramId) {
      throw new UnauthorizedException('x-telegram-id header is required');
    }

    return this.authService.getMeByTelegramId(telegramId);
  }
}