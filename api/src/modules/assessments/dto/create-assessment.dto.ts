import { IsString, IsOptional, IsBoolean, IsInt, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateAssessmentDto {
  @ApiProperty({ example: 'Đề thi giữa kỳ Toán 10' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ required: false, example: 'Mô tả đề thi' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 45, description: 'Thời gian làm bài (phút)' })
  @IsInt()
  @Type(() => Number)
  @Min(1)
  duration: number;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  shuffleQuestions?: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  shuffleOptions?: boolean;

  @ApiProperty({ example: 'section-id' })
  @IsString()
  @MaxLength(255)
  sectionId: string;
}
