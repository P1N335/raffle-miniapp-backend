import { IsOptional, IsString } from 'class-validator';

export class SubmitCasePaymentIntentDto {
  @IsOptional()
  @IsString()
  boc?: string;
}
