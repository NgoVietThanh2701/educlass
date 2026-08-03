import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LessonProgressResponseDto {
  @ApiProperty()
  lessonId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  completed: boolean;

  @ApiProperty()
  lastPosition: number;

  @ApiPropertyOptional()
  completedAt?: Date | null;

  @ApiProperty()
  createdAt: Date;
}
