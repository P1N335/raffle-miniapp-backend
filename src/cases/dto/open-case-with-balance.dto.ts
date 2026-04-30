import { IsString } from 'class-validator';

export class OpenCaseWithBalanceDto {
  @IsString()
  userId!: string;
}
