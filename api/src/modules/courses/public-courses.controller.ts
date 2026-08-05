import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SuccessMessage } from '@common/decorators/message.decorator';
import { CourseListItemDto } from './dto/course-list-item.dto';
import { CoursePublicDetailDto } from './dto/course-public-detail.dto';
import { CoursesService } from './courses.service';

@ApiTags('Public Courses')
@Controller('public/courses')
export class PublicCoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @SuccessMessage('Retrieved published courses successfully')
  @ApiOperation({ summary: 'Get all published courses for public discovery' })
  @ApiResponse({ status: 200, type: CourseListItemDto, isArray: true })
  findAllPublished() {
    return this.coursesService.findAllPublished();
  }

  @Get(':slug')
  @SuccessMessage('Retrieved published course successfully')
  @ApiOperation({ summary: 'Get published course introduction page by slug' })
  @ApiResponse({ status: 200, type: CoursePublicDetailDto })
  findOnePublishedBySlug(@Param('slug') slug: string) {
    return this.coursesService.findOnePublishedBySlug(slug);
  }
}
