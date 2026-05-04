import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class MarkPurchaseFoundDto {
  @IsString()
  providerKey!: string;

  @IsString()
  providerLabel!: string;

  @IsOptional()
  @IsString()
  externalListingId?: string;

  @IsOptional()
  @IsString()
  externalListingUrl?: string;

  @IsOptional()
  @IsInt()
  quotedPriceTon?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNote?: string;
}
