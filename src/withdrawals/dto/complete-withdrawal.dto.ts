import { IsOptional, IsString } from 'class-validator';

export class CompleteWithdrawalDto {
  @IsOptional()
  @IsString()
  telegramOwnedGiftId?: string;
}
