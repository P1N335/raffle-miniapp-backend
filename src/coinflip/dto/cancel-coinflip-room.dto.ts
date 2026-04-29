import { IsString } from 'class-validator';

export class CancelCoinflipRoomDto {
  @IsString()
  userId!: string;
}
