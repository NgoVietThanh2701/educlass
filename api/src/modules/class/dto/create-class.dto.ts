import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({ example: 'Toán 10A' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ required: false, example: 'Mô tả lớp học' })
  @IsString()
  @IsOptional()
  description?: string;
}
