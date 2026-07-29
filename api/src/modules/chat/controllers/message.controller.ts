import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessageService } from '../services/message.service';
import { AttachmentService } from '../services/attachment.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { RelaxedThrottle, ModerateThrottle } from '@common/decorators/custom-throttler.decorator';

@ApiTags('Messages')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly attachmentService: AttachmentService,
  ) {}

  @Post(':convId/messages')
  @RelaxedThrottle()
  @ApiOperation({ summary: 'Send a message to a conversation' })
  sendMessage(
    @Param('convId') convId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: Omit<SendMessageDto, 'conversationId'>,
  ) {
    return this.messageService.sendMessage(userId, { ...dto, conversationId: convId });
  }

  @Get(':convId/messages')
  @ApiOperation({ summary: 'Get messages in a conversation (cursor pagination)' })
  getMessages(
    @Param('convId') convId: string,
    @CurrentUser('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limitStr?: string,
  ) {
    let limit = 50;
    if (limitStr) {
      const parsed = parseInt(limitStr, 10);
      if (!isNaN(parsed) && parsed > 0) {
        limit = Math.min(parsed, 100); // giới hạn tối đa 100
      }
    }
    return this.messageService.getMessages(convId, userId, cursor, limit);
  }

  @Post('upload')
  @ModerateThrottle()
  @ApiOperation({ summary: 'Upload a file attachment' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.attachmentService.uploadFile(file);
  }
}
