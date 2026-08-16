import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssessmentStatus } from '@prisma/client';
import { LessonType } from '@prisma/client';

export class CoursePublicLessonOutlineDto {
  @ApiProperty()
  id: string;

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
}

export class CoursePublicAssessmentOutlineDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty()
  order: number;

  @ApiProperty()
  duration: number;

  @ApiProperty({ enum: AssessmentStatus })
  status: AssessmentStatus;
}

export class CoursePublicSectionOutlineDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty()
  order: number;

  @ApiProperty({ type: [CoursePublicLessonOutlineDto] })
  lessons: CoursePublicLessonOutlineDto[];

  @ApiProperty({ type: [CoursePublicAssessmentOutlineDto] })
  assessments: CoursePublicAssessmentOutlineDto[];
}

export class CoursePublicDetailDto {
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
  thumbnailUrl?: string | null;

  @ApiProperty()
  level: string;

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

  @ApiPropertyOptional()
  requirements?: string | null;

  @ApiPropertyOptional()
  learningOutcomes?: string | null;

  @ApiProperty({ type: [CoursePublicSectionOutlineDto] })
  sections: CoursePublicSectionOutlineDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
