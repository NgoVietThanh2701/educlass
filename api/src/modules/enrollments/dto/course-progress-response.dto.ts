import { ApiProperty } from '@nestjs/swagger';

export class CourseProgressResponseDto {
  @ApiProperty()
  courseId: string;

  @ApiProperty()
  studentId: string;

  @ApiProperty()
  totalLessons: number;

  @ApiProperty()
  completedLessons: number;

  @ApiProperty()
  percent: number;

  @ApiProperty()
  completed: boolean;
}
