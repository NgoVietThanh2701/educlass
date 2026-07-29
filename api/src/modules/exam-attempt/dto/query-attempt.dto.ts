// modules/exam-attempt/dto/query-attempt.dto.ts
import { IntersectionType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsIn, MaxLength } from 'class-validator';
import { AttemptStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Transform } from 'class-transformer';

enum AttemptSortField {
  CREATED_AT = 'createdAt',
  SCORE = 'score',
  STATUS = 'status',
  FINISHED_AT = 'finishedAt',
}

export class QueryAttemptDto extends IntersectionType(PaginationDto) {
  @ApiPropertyOptional({ description: 'Filter by session ID' })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Filter by class ID' })
  @IsString()
  @IsOptional()
  classId?: string;

  @ApiPropertyOptional({ enum: AttemptStatus, description: 'Filter by attempt status' })
  @IsEnum(AttemptStatus)
  @IsOptional()
  status?: AttemptStatus;

  @ApiPropertyOptional({ description: 'Search by student name or username' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: AttemptSortField, default: AttemptSortField.CREATED_AT })
  @IsEnum(AttemptSortField)
  @IsOptional()
  sortBy?: AttemptSortField = AttemptSortField.CREATED_AT;

  @ApiPropertyOptional({ default: 'desc', enum: ['asc', 'desc'], description: 'Sort order' })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  order?: 'asc' | 'desc' = 'desc';
}
