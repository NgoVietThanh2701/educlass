import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseLevel, CourseStatus } from '@prisma/client';

export class CourseListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  teacherId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  shortDescription?: string | null;

  @ApiProperty()
  thumbnailUrl: string;

  @ApiProperty({ enum: CourseLevel })
  level: CourseLevel;

  @ApiPropertyOptional({ description: 'Course category (Vietnamese label)' })
  category?: string | null;

  @ApiProperty()
  language: string;

  @ApiProperty()
  price: number;

  @ApiPropertyOptional()
  publishedAt?: Date | null;

  @ApiPropertyOptional()
  estimatedDuration?: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CourseTeacherListItemDto extends CourseListItemDto {
  @ApiProperty({ enum: CourseStatus })
  status: CourseStatus;

  @ApiPropertyOptional()
  archivedAt?: Date | null;
}

/**
 * Public (published) course card — extends the list item with the teacher's
 * display name and the number of enrolled students.
 */
export class CoursePublicListItemDto extends CourseListItemDto {
  @ApiProperty()
  teacherName: string;

  @ApiProperty()
  students: number;
}
