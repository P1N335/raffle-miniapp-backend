import { IsOptional, IsString, MaxLength } from 'class-validator';

export class MarkPurchaseDeliveredDto {
  @IsOptional()
  @IsString()
  deliveryTelegramGiftId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNote?: string;
}
