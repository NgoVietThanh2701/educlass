import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonType, LessonUnlockRule } from '@prisma/client';
import { LessonAttachmentResponseDto } from './lesson-attachment-response.dto';
import { LessonContentDto } from './lesson-content.dto';

export class LessonResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sectionId: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty({ enum: LessonType })
  type: LessonType;

  @ApiProperty()
  order: number;

  @ApiPropertyOptional()
  durationSeconds?: number | null;

  @ApiProperty()
  isPreview: boolean;

  @ApiProperty({ enum: LessonUnlockRule })
  unlockRule: LessonUnlockRule;

  @ApiPropertyOptional({ type: LessonContentDto })
  content?: LessonContentDto;

  @ApiProperty({ type: [LessonAttachmentResponseDto] })
  attachments: LessonAttachmentResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
