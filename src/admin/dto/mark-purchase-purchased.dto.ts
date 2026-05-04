import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class MarkPurchasePurchasedDto {
  @IsOptional()
  @IsString()
  externalOrderId?: string;

  @IsOptional()
  @IsInt()
  purchasedPriceTon?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNote?: string;
}
