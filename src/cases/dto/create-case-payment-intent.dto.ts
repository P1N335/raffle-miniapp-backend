import { IsOptional, IsString } from 'class-validator';

export class CreateCasePaymentIntentDto {
  @IsString()
  walletAddress!: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
