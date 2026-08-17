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

// Dev-friendly CORS for the Socket.IO server: `origin: true` reflects ANY
// request origin (localhost / 127.0.0.1 / LAN IP the browser uses), otherwise
// engine.io rejects the cross-origin WebSocket/polling handshake with
// "WebSocket is closed before the connection is established". Tighten this when
// deploying (e.g. an explicit allow-list) via the SOCKET_ORIGINS env.
const SOCKET_SERVER_CORS = { origin: true, credentials: true };

@WebSocketGateway({
  namespace: 'chat',
  cors: SOCKET_SERVER_CORS,
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
      this.logger.warn(
        `Join DENIED: user ${client.user.id} is not a participant of ${data.conversationId}`,
      );
      throw AppException.wsException('You are not a participant of this conversation');
    }

    const room = `conversation:${data.conversationId}`;
    await client.join(room);
    client.emit('joined', { conversationId: data.conversationId });
    this.logger.log(`Joined room ${room} (client ${client.id}, user ${client.user.id})`);
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
    // MUST NOT throw: this runs inside the REST send path, so a failed
    // broadcast must never break message creation.
    this.logger.log(
      `emit newMessage -> conversation:${conversationId} (message id: ${(message as { id?: string })?.id})`,
    );
    this.server?.to(`conversation:${conversationId}`).emit('newMessage', message);
  }
}
