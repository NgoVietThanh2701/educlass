import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateExamSessionDto } from './create-exam-session.dto';

export class UpdateExamSessionDto extends PartialType(
  OmitType(CreateExamSessionDto, ['examId', 'classId'] as const),
) {}
