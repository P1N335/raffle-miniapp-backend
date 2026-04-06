import { IsOptional, IsString } from 'class-validator';

export class OpenCaseDto {
  @IsOptional()
  @IsString()
  userId?: string;
}
