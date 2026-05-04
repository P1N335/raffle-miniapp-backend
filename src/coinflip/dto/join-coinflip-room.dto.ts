import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

export class JoinCoinflipRoomDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  openingIds!: string[];
}
