import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

export class CreateCoinflipRoomDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  openingIds!: string[];
}
