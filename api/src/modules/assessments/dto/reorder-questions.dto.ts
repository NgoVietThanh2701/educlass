import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsString } from 'class-validator';

export class ReorderQuestionsDto {
  @ApiProperty({
    type: [String],
    description:
      'Question ids in their new display order (must match all the assessment questions).',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  orderedIds: string[];
}
