import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminBalanceAdjustmentDto {
  @IsInt()
  amountTon!: number;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  note?: string;
}
