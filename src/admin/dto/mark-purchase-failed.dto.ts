import { IsOptional, IsString, MaxLength } from 'class-validator';

export class MarkPurchaseFailedDto {
  @IsString()
  @MaxLength(1000)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNote?: string;
}
