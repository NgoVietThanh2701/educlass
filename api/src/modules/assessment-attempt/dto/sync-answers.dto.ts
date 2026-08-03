import { IsArray, ValidateNested, ArrayMinSize, IsString, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SyncAnswerDto {
  @ApiProperty({ description: 'Question ID' })
  @IsString()
  questionId: string;

  @ApiProperty({ description: 'Array of selected option IDs' })
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()
  optionIds: string[];
}

export class SyncAnswersDto {
  @ApiProperty({ type: [SyncAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncAnswerDto)
  @ArrayMinSize(1)
  answers: SyncAnswerDto[];
}
