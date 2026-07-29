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
import type { AuthenticatedSocket, JwtPayload } from '@common/interfaces/auth-user.interface';
import { SendMessageDto } from './dto/send-message.dto';
import { AppConfig } from '@common/constants/app-config.constant';
import { ConversationService } from './services/conversation.service';
import { JwtService } from '@nestjs/jwt';
import { AuthValidationService } from '@modules/auth/auth-validation.service';
import { Logger } from '@nestjs/common';
import { AppException } from '@common/exceptions/app.exception';

@WebSocketGateway({ namespace: 'chat', cors: { origin: AppConfig.APP_URL, credentials: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messageService: MessageService,
    private readonly conversationService: ConversationService,
    private readonly jwtService: JwtService,
    private readonly authValidationService: AuthValidationService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token ?? client.handshake.query?.token;
      if (typeof token !== 'string') {
        throw new Error('No token provided');
      }
      const payload = this.jwtService.verify<JwtPayload>(token);
      client.user = await this.authValidationService.validateJwtPayload(payload);
      this.logger.log(`Client connected: ${client.id} (user: ${client.user.id})`);
    } catch (err) {
      const error = err as Error;
      this.logger.error('Socket authentication failed:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

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
      throw AppException.wsException('You are not a participant of this conversation');
    }

    await client.join(`conversation:${data.conversationId}`);
    client.emit('joined', { conversationId: data.conversationId });
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const message = await this.messageService.sendMessage(client.user.id, dto);
    this.server.to(`conversation:${dto.conversationId}`).emit('newMessage', message);
  }
}
