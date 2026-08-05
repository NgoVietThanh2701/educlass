import { ApiProperty } from '@nestjs/swagger';
import { AssessmentDetailResponseDto } from '@modules/assessments/dto/assessment-detail-response.dto';
import { LessonResponseDto } from '@modules/lessons/dto/lesson-response.dto';
import { SectionResponseDto } from '@modules/sections/dto/section-response.dto';
import { CourseResponseDto } from './course-response.dto';

export class CourseTeacherSectionDetailDto extends SectionResponseDto {
  @ApiProperty({ type: [LessonResponseDto] })
  lessons: LessonResponseDto[];

  @ApiProperty({ type: [AssessmentDetailResponseDto] })
  assessments: AssessmentDetailResponseDto[];
}

export class CourseTeacherDetailDto extends CourseResponseDto {
  @ApiProperty({ type: [CourseTeacherSectionDetailDto] })
  sections: CourseTeacherSectionDetailDto[];
}
