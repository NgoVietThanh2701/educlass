import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { MessageService } from './services/message.service';
import type { AuthenticatedSocket, JwtPayload } from '@common/interfaces/auth-user.interface';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationService } from './services/conversation.service';
import { JwtService } from '@nestjs/jwt';
import { AuthValidationService } from '@modules/auth/auth-validation.service';
import { Logger } from '@nestjs/common';
import { AppException } from '@common/exceptions/app.exception';
import { AppConfig } from '@common/constants/app-config.constant';

@WebSocketGateway({
  namespace: 'chat',
  cors: { origin: [process.env.ALLOWED_ORIGINS ?? AppConfig.APP_URL], credentials: true },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messageService: MessageService,
    private readonly conversationService: ConversationService,
    private readonly jwtService: JwtService,
    private readonly authValidationService: AuthValidationService,
  ) {}

  afterInit(server: Server) {
    server.use((socket, next) => {
      const token = socket.handshake.auth?.token ?? socket.handshake.query?.token;

      if (typeof token !== 'string') {
        this.logger.error('Socket authentication failed: no token provided');
        return next(new Error('Unauthorized'));
      }

      let payload: JwtPayload;

      try {
        payload = this.jwtService.verify<JwtPayload>(token);
      } catch (err) {
        this.logger.error('Socket authentication failed:', (err as Error).message);
        return next(new Error('Unauthorized'));
      }
      this.authValidationService
        .validateJwtPayload(payload)
        .then((user) => {
          (socket as AuthenticatedSocket).user = user;
          next();
        })
        .catch((err) => {
          this.logger.error('Socket authentication failed:', (err as Error).message);
          next(new Error('Unauthorized'));
        });
    });
  }

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id} (user: ${client.user?.id ?? 'unknown'})`);
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
    this.emitNewMessage(dto.conversationId, message);
  }

  /**
   * Broadcast a newly created message to all sockets currently joined to the
   * conversation room. Used by BOTH the socket `sendMessage` handler and the
   * REST `POST /conversations/:id/messages` path so sending is always realtime
   * regardless of the transport the client used.
   */
  emitNewMessage(conversationId: string, message: unknown) {
    this.server?.to(`conversation:${conversationId}`).emit('newMessage', message);
  }
}
