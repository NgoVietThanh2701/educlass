import { PartialType, OmitType } from '@nestjs/swagger';
import { AddQuestionDto } from './add-question.dto';

export class UpdateQuestionDto extends PartialType(
  OmitType(AddQuestionDto, ['options'] as const),
) {}
