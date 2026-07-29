import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Controller, Post, Get, Param, Body, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RoleUser } from '@prisma/client';
import { ConversationService } from '../services/conversation.service';
import { CreateDirectConversationDto } from '../dto/create-direct-conversation.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { RolesUser } from '@common/decorators/roles.decorator';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { ModerateThrottle, StrictThrottle } from '@common/decorators/custom-throttler.decorator';

@ApiTags('Conversations')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post('direct')
  @ModerateThrottle()
  @ApiOperation({ summary: 'Create or get a direct conversation with another user' })
  @ApiResponse({
    status: 201,
    description: 'Direct conversation created or retrieved successfully',
  })
  createDirect(@CurrentUser('id') userId: string, @Body() dto: CreateDirectConversationDto) {
    return this.conversationService.createOrGetDirect(userId, dto.targetUserId);
  }

  // @Post('group')
  // @ApiOperation({ summary: 'Create or get a group conversation for a class' })
  // createGroup(@CurrentUser('id') userId: string, @Body() dto: CreateGroupConversationDto) {
  //   return this.conversationService.createOrGetGroup(dto.classId, userId);
  // }

  @Get()
  @ApiOperation({ summary: 'Get all conversations for current user' })
  getMyConversations(@CurrentUser('id') userId: string) {
    return this.conversationService.getConversationsForUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a conversation by ID' })
  getOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.conversationService.findOne(id, userId);
  }

  @Patch(':id/permission')
  @StrictThrottle()
  @RolesUser(RoleUser.TEACHER)
  @ApiOperation({ summary: 'Update group message permission (teacher only)' })
  updatePermission(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.conversationService.updatePermission(id, userId, dto.permission);
  }
}
