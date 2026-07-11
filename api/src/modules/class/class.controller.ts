import { Body, Controller, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClassService } from './class.service';
import { RoleUser } from '@prisma/client';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesUserGuard } from '@common/guards/role-user.guard';
import { RolesUser } from '@common/decorators/roles.decorator';
import { CreateClassDto } from './dto/create-class.dto';
import { ClassResponseDto } from './dto/class-response.dto';
import { GetUser } from '@common/decorators/get-user.decorator';

@ApiTags('Classes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesUserGuard)
@Controller('classes')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  // ========== Teacher endpoints ==========
  @Post()
  @RolesUser(RoleUser.TEACHER)
  @ApiOperation({ summary: 'Tạo lớp học (teacher)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Created class successfully',
    type: ClassResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only teacher can create class',
  })
  create(@GetUser('id') teacherId: string, @Body() dto: CreateClassDto): Promise<ClassResponseDto> {
    return this.classService.create(teacherId, dto);
  }
}
