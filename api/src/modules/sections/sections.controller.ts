import { CurrentUser } from '@common/decorators/current-user.decorator';
import { SuccessMessage } from '@common/decorators/message.decorator';
import { RolesUser } from '@common/decorators/roles.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesUserGuard } from '@common/guards/role-user.guard';
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleUser } from '@prisma/client';
import { CreateSectionDto } from './dto/create-section.dto';
import { SectionResponseDto } from './dto/section-response.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { SectionsService } from './sections.service';

@ApiTags('Sections')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesUserGuard)
@RolesUser(RoleUser.TEACHER)
@Controller('courses/:courseId/sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Post()
  @SuccessMessage('Created section successfully')
  @ApiOperation({ summary: 'Create a new section under a course' })
  @ApiResponse({
    status: 201,
    description: 'Section created successfully',
    type: SectionResponseDto,
  })
  create(
    @Param('courseId') courseId: string,
    @CurrentUser('id') teacherId: string,
    @Body() dto: CreateSectionDto,
  ) {
    return this.sectionsService.create(courseId, teacherId, dto);
  }

  @Get()
  @RolesUser(RoleUser.TEACHER)
  @SuccessMessage('Retrieved sections successfully')
  @ApiOperation({ summary: 'Get all sections of a course' })
  @ApiResponse({ status: 200, type: SectionResponseDto, isArray: true })
  findAll(@Param('courseId') courseId: string, @CurrentUser('id') teacherId: string) {
    return this.sectionsService.findAll(courseId, teacherId);
  }

  @Get('student')
  @RolesUser(RoleUser.STUDENT)
  @SuccessMessage('Retrieved sections successfully')
  @ApiOperation({ summary: 'Student: Get all sections of an enrolled course' })
  @ApiResponse({ status: 200, type: SectionResponseDto, isArray: true })
  findAllForStudent(@Param('courseId') courseId: string, @CurrentUser('id') studentId: string) {
    return this.sectionsService.findAllForStudent(courseId, studentId);
  }

  @Get(':sectionId')
  @RolesUser(RoleUser.TEACHER)
  @SuccessMessage('Retrieved section successfully')
  @ApiOperation({ summary: 'Get section detail' })
  @ApiResponse({ status: 200, type: SectionResponseDto })
  findOne(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser('id') teacherId: string,
  ) {
    return this.sectionsService.findOne(courseId, sectionId, teacherId);
  }

  @Get('student/:sectionId')
  @RolesUser(RoleUser.STUDENT)
  @SuccessMessage('Retrieved section successfully')
  @ApiOperation({ summary: 'Student: Get section detail for an enrolled course' })
  @ApiResponse({ status: 200, type: SectionResponseDto })
  findOneForStudent(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.sectionsService.findOneForStudent(courseId, sectionId, studentId);
  }

  @Patch(':sectionId')
  @RolesUser(RoleUser.TEACHER)
  @SuccessMessage('Updated section successfully')
  @ApiOperation({ summary: 'Update section' })
  @ApiResponse({ status: 200, type: SectionResponseDto })
  update(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser('id') teacherId: string,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.sectionsService.update(courseId, sectionId, teacherId, dto);
  }
}
