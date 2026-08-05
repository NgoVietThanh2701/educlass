import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CourseStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { CreateCourseDto } from './create-course.dto';

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}

export class ChangeCourseStatusDto {
  @ApiProperty({
    enum: CourseStatus,
    example: CourseStatus.PUBLISHED,
  })
  @IsEnum(CourseStatus)
  status: CourseStatus;
}
