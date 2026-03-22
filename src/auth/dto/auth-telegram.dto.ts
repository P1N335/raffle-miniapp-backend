import { IsString } from 'class-validator';

export class AuthTelegramDto {
  @IsString()
  initData: string;
}