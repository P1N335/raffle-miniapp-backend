import { IsString } from 'class-validator';

export class CreateCasePaymentIntentDto {
  @IsString()
  walletAddress!: string;
}
