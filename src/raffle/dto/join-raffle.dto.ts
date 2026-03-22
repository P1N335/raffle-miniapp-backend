import { IsInt, IsPositive, IsString } from 'class-validator';

export class JoinRaffleDto {
  @IsString()
  userId: string;

  @IsInt()
  @IsPositive()
  amount: number;
}