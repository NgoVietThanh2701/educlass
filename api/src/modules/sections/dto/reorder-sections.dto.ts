import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsString } from 'class-validator';

export class ReorderSectionsDto {
  @ApiProperty({
    type: [String],
    description: 'Section ids in their new display order (must match all the course sections).',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  orderedIds: string[];
}
