import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionType } from '@prisma/client';
import { AddOptionDto } from './add-option.dto';

export class AddQuestionDto {
  @ApiProperty({ example: 'Thủ đô của Việt Nam là?' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiProperty({ default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  score?: number;

  @ApiProperty({ enum: QuestionType, default: QuestionType.SINGLE })
  @IsEnum(QuestionType)
  @IsOptional()
  type?: QuestionType;

  @ApiProperty({ type: [AddOptionDto], description: 'Danh sách lựa chọn (ít nhất 2)' })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => AddOptionDto)
  options: AddOptionDto[];
}
