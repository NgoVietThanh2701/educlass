import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { MessageService } from './services/message.service';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import type { AuthenticatedSocket } from '@common/interfaces/auth-user.interface';
import { SendMessageDto } from './dto/send-message.dto';
import { AppConfig } from '@common/constants/app-config.constant';
import { ConversationService } from './services/conversation.service';

@WebSocketGateway({ namespace: 'chat', cors: { origin: AppConfig.APP_URL, credentials: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messageService: MessageService,
    private readonly conversationService: ConversationService,
  ) {}

  handleConnection(client: AuthenticatedSocket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const isParticipant = await this.conversationService.isUserParticipant(
      data.conversationId,
      client.user.id,
    );
    if (!isParticipant) {
      client.emit('error', { message: 'You are not a participant of this conversation' });
      return;
    }

    await client.join(`conversation:${data.conversationId}`);
    client.emit('joined', { conversationId: data.conversationId });
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const message = await this.messageService.sendMessage(client.user.id, dto);
    this.server.to(`conversation:${dto.conversationId}`).emit('newMessage', message);
  }
}
