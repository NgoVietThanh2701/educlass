import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({ example: 'Math 10A' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ required: false, example: 'Description class' })
  @IsString()
  @IsOptional()
  description?: string;
}
