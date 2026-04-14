import { IsString } from 'class-validator';

export class FailWithdrawalDto {
  @IsString()
  reason!: string;
}
