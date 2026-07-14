import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClassService } from './class.service';
import { RoleUser } from '@prisma/client';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesUserGuard } from '@common/guards/role-user.guard';
import { RolesUser } from '@common/decorators/roles.decorator';
import { CreateClassDto } from './dto/create-class.dto';
import { ClassResponseDto } from './dto/class-response.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { SuccessMessage } from '@common/decorators/message.decorator';
import { UpdateClassDto } from './dto/update-class.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { CreateStudentDto, CreateStudentResponseDto } from './dto/student.dto';

@ApiTags('Classes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesUserGuard)
@Controller('classes')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  // Create class (Only Teacher)
  @Post()
  @RolesUser(RoleUser.TEACHER)
  @SuccessMessage('Created class successfully')
  @ApiOperation({ summary: 'Create new class (Only teacher)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Created class successfully',
    type: ClassResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only teacher can create class',
  })
  create(
    @CurrentUser('id') teacherId: string,
    @Body() dto: CreateClassDto,
  ): Promise<ClassResponseDto> {
    return this.classService.create(teacherId, dto);
  }

  // Get all class (teacher and student)
  @Get()
  @SuccessMessage('Get all class successfully')
  @ApiOperation({ summary: 'Get all class  (teacher or student)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get all class successfully',
    type: [ClassResponseDto],
  })
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: RoleUser,
  ): Promise<ClassResponseDto[]> {
    return this.classService.findAll(userId, role);
  }

  // Get detail class (teacher and student)
  @Get(':id')
  @SuccessMessage('Get class details successfully')
  @ApiOperation({ summary: 'Get class detail (teacher or student)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get class details successfully',
    type: ClassResponseDto,
  })
  async findOne(
    @Param('id') classId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: RoleUser,
  ) {
    return this.classService.findOne(classId, userId, role);
  }

  // Update class (Only Teacher)
  @Patch(':id')
  @RolesUser(RoleUser.TEACHER)
  @SuccessMessage('Updated class successfully')
  @ApiOperation({ summary: 'Update class (Only teacher)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Updated class successfully',
    type: ClassResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only class owner can update class',
  })
  update(
    @Param('id') classId: string,
    @CurrentUser('id') teacherId: string,
    @Body() dto: UpdateClassDto,
  ): Promise<ClassResponseDto> {
    return this.classService.update(classId, teacherId, dto);
  }

  // Archive class (Only Teacher)
  @Delete(':id')
  @RolesUser(RoleUser.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @SuccessMessage('Archived class successfully')
  @ApiOperation({ summary: 'Archive class (Only teacher)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Archived class successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only class owner can archive class',
  })
  remove(@Param('id') classId: string, @CurrentUser('id') teacherId: string): Promise<void> {
    return this.classService.remove(classId, teacherId);
  }

  // Add student to class (Only Teacher)
  @Post(':id/students')
  @RolesUser(RoleUser.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  @SuccessMessage('Added student successfully')
  @ApiOperation({ summary: 'Add student to class (Only teacher)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Added student successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only class owner can add student',
  })
  addStudent(
    @Param('id') classId: string,
    @CurrentUser('id') teacherId: string,
    @Body() dto: AddStudentDto,
  ): Promise<void> {
    return this.classService.addStudent(classId, teacherId, dto);
  }

  // Remove student from class (Only Teacher)
  @Delete(':id/students/:studentId')
  @RolesUser(RoleUser.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @SuccessMessage('Removed student successfully')
  @ApiOperation({ summary: 'Remove student from class (Only teacher)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Removed student successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only class owner can remove student',
  })
  removeStudent(
    @Param('id') classId: string,
    @Param('studentId') studentId: string,
    @CurrentUser('id') teacherId: string,
  ): Promise<void> {
    return this.classService.removeStudent(classId, teacherId, studentId);
  }

  // Student leave class
  @Delete(':id/leave')
  @RolesUser(RoleUser.STUDENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @SuccessMessage('Left class successfully')
  @ApiOperation({ summary: 'Leave class (Only student)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Left class successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Not found class',
  })
  leaveClass(@Param('id') classId: string, @CurrentUser('id') studentId: string): Promise<void> {
    return this.classService.leaveClass(classId, studentId);
  }

  // Create student and add to this class (Only teacher)
  @Post(':id/students/create')
  @RolesUser(RoleUser.TEACHER)
  @SuccessMessage('Created student successfully')
  @ApiOperation({
    summary: 'Create student and add to class',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: CreateStudentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Not found class',
  })
  createStudent(
    @Param('id') classId: string,
    @CurrentUser('id') teacherId: string,
    @Body() dto: CreateStudentDto,
  ): Promise<void> {
    return this.classService.createStudent(classId, teacherId, dto);
  }
}
