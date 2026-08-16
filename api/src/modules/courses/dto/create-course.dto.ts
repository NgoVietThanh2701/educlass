import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseLevel } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { CourseCategory } from '../course-category.enum';

export class CreateCourseDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  shortDescription: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ enum: CourseLevel, default: CourseLevel.ALL })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @ApiPropertyOptional({ description: 'Course category (Vietnamese label)' })
  @IsOptional()
  @IsEnum(CourseCategory)
  category?: CourseCategory;

  @ApiPropertyOptional({ default: 'vi' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  estimatedDuration: number;

  @ApiPropertyOptional({ default: 'basic html, css, javascript' })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional({ default: 'learn how to build a website' })
  @IsOptional()
  @IsString()
  learningOutcomes?: string;
}
