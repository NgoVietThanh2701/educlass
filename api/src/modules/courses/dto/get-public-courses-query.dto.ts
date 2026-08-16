import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { CourseLevel } from '@prisma/client';
import { PaginationDto } from '@common/dto/pagination.dto';
import { CourseCategory } from '../course-category.enum';

export const PUBLIC_COURSE_SORT_FIELDS = ['publishedAt', 'price', 'title', 'createdAt'] as const;
export type PublicCourseSortField = (typeof PUBLIC_COURSE_SORT_FIELDS)[number];

/**
 * Query params for the public course catalog. Reuses the shared `PaginationDto`
 * (page + limit, limit capped at 50) and adds filters, search and sorting so
 * the landing "featured" section AND the future catalog page share one endpoint.
 */
export class GetPublicCoursesQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Course category — the Vietnamese label (e.g. "Lập trình")',
  })
  @IsOptional()
  @IsEnum(CourseCategory, { message: 'Invalid category' })
  category?: string;

  @ApiPropertyOptional({ enum: ['free', 'paid'], description: 'Filter by price' })
  @IsOptional()
  @IsIn(['free', 'paid'])
  price?: 'free' | 'paid';

  @ApiPropertyOptional({ enum: CourseLevel })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @ApiPropertyOptional({ description: 'Search by title or short description' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: PUBLIC_COURSE_SORT_FIELDS, default: 'publishedAt' })
  @IsOptional()
  @IsIn(PUBLIC_COURSE_SORT_FIELDS)
  sortBy?: PublicCourseSortField = 'publishedAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
}
