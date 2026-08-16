import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SuccessMessage } from '@common/decorators/message.decorator';
import { CoursePublicDetailDto } from './dto/course-public-detail.dto';
import { GetPublicCoursesQueryDto } from './dto/get-public-courses-query.dto';
import { PaginatedCoursesDto } from './dto/course-paginated.dto';
import { CoursesService } from './courses.service';

@ApiTags('Public Courses')
@Controller('public/courses')
export class PublicCoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @SuccessMessage('Retrieved published courses successfully')
  @ApiOperation({ summary: 'Get published courses for public discovery (paginated)' })
  @ApiResponse({ status: 200, type: PaginatedCoursesDto })
  findAllPublished(@Query() query: GetPublicCoursesQueryDto) {
    return this.coursesService.findAllPublished(query);
  }

  @Get(':slug')
  @SuccessMessage('Retrieved published course successfully')
  @ApiOperation({ summary: 'Get published course introduction page by slug' })
  @ApiResponse({ status: 200, type: CoursePublicDetailDto })
  findOnePublishedBySlug(@Param('slug') slug: string) {
    return this.coursesService.findOnePublishedBySlug(slug);
  }
}
