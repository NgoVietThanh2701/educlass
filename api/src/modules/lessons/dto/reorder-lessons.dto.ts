import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsString } from 'class-validator';

export class ReorderLessonsDto {
  @ApiProperty({
    type: [String],
    description: 'Lesson ids in their new display order (must match all the section lessons).',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  orderedIds: string[];
}
