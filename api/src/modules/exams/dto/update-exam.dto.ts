import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateExamDto } from './create-exam.dto';
import { ExamStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateExamDto extends PartialType(CreateExamDto) {}

export class ChangeExamStatusDto {
  @ApiProperty({
    enum: ExamStatus,
    example: ExamStatus.PUBLISHED,
  })
  @IsEnum(ExamStatus)
  status: ExamStatus;
}
