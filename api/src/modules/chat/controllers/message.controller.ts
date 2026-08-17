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
import { ApiFileUploadBody } from '@common/swagger/file-upload.swagger';
import { MessageService } from '../services/message.service';
import { AttachmentService } from '@common/services/attachment.service';
import { ChatGateway } from '../chat.gateway';
import { SendMessageDto } from '../dto/send-message.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { RelaxedThrottle } from '@common/decorators/custom-throttler.decorator';
import { AppException } from '@common/exceptions/app.exception';
import { UPLOAD_ALLOWED_MIME_TYPES, UPLOAD_MAX_FILE_SIZE } from '@common/constants/upload.constant';

@ApiTags('Messages')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@RelaxedThrottle()
@Controller('conversations')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly attachmentService: AttachmentService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post(':convId/messages')
  @RelaxedThrottle()
  @ApiOperation({ summary: 'Send a message to a conversation' })
  async sendMessage(
    @Param('convId') convId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: Omit<SendMessageDto, 'conversationId'>,
  ) {
    const message = await this.messageService.sendMessage(userId, {
      ...dto,
      conversationId: convId,
    });
    // Emit the same `newMessage` socket event the WS `sendMessage` handler does,
    // so the other participant(s) see the message in real time.
    this.chatGateway.emitNewMessage(convId, message);
    return message;
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
  @ApiFileUploadBody()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: UPLOAD_MAX_FILE_SIZE },
      fileFilter: (req, file, cb) => {
        if (UPLOAD_ALLOWED_MIME_TYPES.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(null, false);
        }
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw AppException.badRequest('No file uploaded or file type not allowed');
    }

    if (file.size > UPLOAD_MAX_FILE_SIZE) {
      throw AppException.badRequest('File size exceeds the allowed limit');
    }
    if (!UPLOAD_ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw AppException.badRequest('File type is not allowed');
    }

    return this.attachmentService.uploadFile(file, 'chat');
  }
}
