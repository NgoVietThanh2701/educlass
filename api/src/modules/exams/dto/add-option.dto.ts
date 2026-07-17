import { IsString, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddOptionDto {
  @ApiProperty({ example: 'Hà Nội' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  isCorrect?: boolean;
}
