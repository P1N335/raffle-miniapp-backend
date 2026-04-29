import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

export class JoinCoinflipRoomDto {
  @IsString()
  userId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  openingIds!: string[];
}
