import { Module } from '@nestjs/common';
import { ConversationService } from './services/conversation.service';
import { MessageService } from './services/message.service';
import { AttachmentService } from './services/attachment.service';
import { ChatGateway } from './chat.gateway';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { ConversationController } from './controllers/conversation.controller';
import { MessageController } from './controllers/message.controller';
import { PrismaModule } from '@prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ConversationController, MessageController],
  providers: [ConversationService, MessageService, AttachmentService, ChatGateway, WsJwtAuthGuard],
  exports: [ConversationService],
})
export class ChatModule {}
