import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';
import type { RequestWithUser } from '@common/interfaces/request.interface';
import { SuccessMessage } from '@common/decorators/message.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesUserGuard } from '@common/guards/role-user.guard';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesUserGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Get current profile
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @SuccessMessage('User profile retrieved successfully')
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() req: RequestWithUser): Promise<UserResponseDto> {
    return this.usersService.getCurrentProfile(req.user.id);
  }

  // create student (only TEACHER)
  //@post('students')
}
