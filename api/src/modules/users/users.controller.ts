import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';
import { SuccessMessage } from '@common/decorators/message.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesUserGuard } from '@common/guards/role-user.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { RelaxedThrottle } from '@common/decorators/custom-throttler.decorator';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesUserGuard)
@RelaxedThrottle()
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
  getProfile(@CurrentUser('id') userId: string): Promise<UserResponseDto> {
    return this.usersService.getCurrentProfile(userId);
  }
}
