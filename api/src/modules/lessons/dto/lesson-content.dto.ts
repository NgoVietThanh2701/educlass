import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class LessonContentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  objectKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  videoDuration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  textContent?: string;
}
