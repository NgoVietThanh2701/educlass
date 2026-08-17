import { ApiProperty } from '@nestjs/swagger';
import { AssessmentTeacherItemDto } from '@modules/assessments/dto/assessment-response.dto';
import { LessonResponseDto } from '@modules/lessons/dto/lesson-response.dto';
import { SectionResponseDto } from '@modules/sections/dto/section-response.dto';
import { CourseResponseDto } from './course-response.dto';

export class CourseTeacherSectionDetailDto extends SectionResponseDto {
  @ApiProperty({ type: [LessonResponseDto] })
  lessons: LessonResponseDto[];

  @ApiProperty({ type: [AssessmentTeacherItemDto] })
  assessments: AssessmentTeacherItemDto[];
}

export class CourseTeacherDetailDto extends CourseResponseDto {
  @ApiProperty({
    description: 'Number of students currently enrolled in the course',
  })
  studentCount: number;

  @ApiProperty({ type: [CourseTeacherSectionDetailDto] })
  sections: CourseTeacherSectionDetailDto[];
}
