import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssessmentStatus } from '@prisma/client';
import { LessonType, LessonUnlockRule } from '@prisma/client';
import { CourseProgressResponseDto } from '@modules/enrollments/dto/course-progress-response.dto';
import { LessonProgressResponseDto } from '@modules/lessons/dto/lesson-progress-response.dto';

export class CourseStudentLessonItemDto {
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

  @ApiProperty()
  isUnlocked: boolean;

  @ApiProperty({ type: LessonProgressResponseDto })
  progress: LessonProgressResponseDto;
}

export class CourseStudentAssessmentItemDto {
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

  @ApiProperty()
  questionCount: number;
}

export class CourseStudentSectionDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  courseId: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty()
  order: number;

  @ApiProperty({ type: [CourseStudentLessonItemDto] })
  lessons: CourseStudentLessonItemDto[];

  @ApiProperty({ type: [CourseStudentAssessmentItemDto] })
  assessments: CourseStudentAssessmentItemDto[];
}

export class CourseStudentDetailDto {
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
  thumbnailUrl: string;

  @ApiProperty()
  level: string;

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

  @ApiProperty({ type: CourseProgressResponseDto })
  progress: CourseProgressResponseDto;

  @ApiProperty({ type: [CourseStudentSectionDetailDto] })
  sections: CourseStudentSectionDetailDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
