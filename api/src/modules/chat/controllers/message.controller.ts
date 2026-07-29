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
import { RelaxedThrottle } from '@common/decorators/custom-throttler.decorator';
import { AppException } from '@common/exceptions/app.exception';
import { CHAT_ALLOWED_MIME_TYPES, CHAT_MAX_UPLOAD_SIZE } from '../chat.constants';

@ApiTags('Messages')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@RelaxedThrottle()
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
    let limit = 30;
    if (limitStr) {
      const parsed = parseInt(limitStr, 10);
      if (!isNaN(parsed) && parsed > 0) {
        limit = Math.min(parsed, 100); // giới hạn tối đa 100
      }
    }
    return this.messageService.getMessages(convId, userId, cursor, limit);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file attachment' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: CHAT_MAX_UPLOAD_SIZE },
      fileFilter: (req, file, cb) => {
        if (CHAT_ALLOWED_MIME_TYPES.has(file.mimetype)) {
          cb(null, true);
        } else {
          // Reject file silently (no file will be provided), controller will respond with error
          cb(null, false);
        }
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw AppException.badRequest('No file uploaded or file type not allowed');
    }

    if (file.size > CHAT_MAX_UPLOAD_SIZE) {
      throw AppException.badRequest('File size exceeds the allowed limit');
    }
    if (!CHAT_ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw AppException.badRequest('File type is not allowed');
    }

    return this.attachmentService.uploadFile(file);
  }
}
