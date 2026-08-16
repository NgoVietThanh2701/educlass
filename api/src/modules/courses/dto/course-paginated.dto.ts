import { ApiProperty } from '@nestjs/swagger';
import { MetaPagingResponseDto } from '@common/dto/pagination-response.dto';
import { CoursePublicListItemDto } from './course-list-item.dto';

export class PaginatedCoursesDto {
  @ApiProperty({ type: CoursePublicListItemDto, isArray: true })
  data: CoursePublicListItemDto[];

  @ApiProperty({ type: MetaPagingResponseDto })
  meta: MetaPagingResponseDto;
}
