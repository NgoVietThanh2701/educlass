import { ApiProperty } from '@nestjs/swagger';

export class LessonAttachmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  lessonId: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  objectKey: string;

  @ApiProperty()
  resourceType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  createdAt: Date;
}
