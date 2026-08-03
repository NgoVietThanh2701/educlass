import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateAssessmentDto } from './create-assessment.dto';
import { AssessmentStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateAssessmentDto extends PartialType(CreateAssessmentDto) {}

export class ChangeAssessmentStatusDto {
  @ApiProperty({
    enum: AssessmentStatus,
    example: AssessmentStatus.PUBLISHED,
  })
  @IsEnum(AssessmentStatus)
  status: AssessmentStatus;
}
