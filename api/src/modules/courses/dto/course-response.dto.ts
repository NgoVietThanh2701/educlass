import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseLevel, CourseStatus } from '@prisma/client';

export class CourseResponseDto {
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

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  thumbnailObjectKey?: string | null;

  @ApiProperty({ enum: CourseLevel })
  level: CourseLevel;

  @ApiProperty()
  language: string;

  @ApiProperty()
  price: number;

  @ApiProperty({ enum: CourseStatus })
  status: CourseStatus;

  @ApiPropertyOptional()
  publishedAt?: Date | null;

  @ApiPropertyOptional()
  estimatedDuration?: number | null;

  @ApiPropertyOptional()
  requirements?: string | null;

  @ApiPropertyOptional()
  learningOutcomes?: string | null;

  @ApiPropertyOptional()
  archivedAt?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
