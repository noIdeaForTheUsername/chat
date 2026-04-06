import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Throttle } from '@nestjs/throttler';
import { OnGatewayConnection, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AccountsDomainService } from 'src/domain/accounts/accounts.service';
import { ConversationClearedEvent } from 'src/shared/events/conversation-cleared.event';
import { MessageDeletedEvent } from 'src/shared/events/message-deleted.event';
import { MessageSentEvent } from 'src/shared/events/message-sent.event';
import { UserLogoutEvent } from 'src/shared/events/user-logout.event';
import { WEBSOCKET_EVENTS_RATE_LIMIT } from 'src/shared/global-rate-limiting/rate-limiting-settings';
import { WsThrottlerGuard } from 'src/shared/global-rate-limiting/ws-throttler.guard';
import { getWsAuthMiddleware, getWsOriginFilterMiddleware, getWsSessionMiddleware } from 'src/shared/websocket-middlewares';
import { MessageAcknowledgeDto } from './dto/message-acknowledge.dto';
import { MessagesService } from './messages.service';


@UsePipes(new ValidationPipe({ whitelist: true, transform: true, exceptionFactory: (errors) => new WsException(errors) }))
@UseGuards(WsThrottlerGuard)  // auth check via session middleware in afterInit
@Throttle(WEBSOCKET_EVENTS_RATE_LIMIT)
@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  }
})
export class MessagesGateway implements OnGatewayInit, OnGatewayConnection {

  @WebSocketServer()
  private server: Server;

  private readonly allowedOrigins: string[];

  constructor(
    private messagesService: MessagesService,
    private accounts: AccountsDomainService,
    private configService: ConfigService
  ) {
    this.allowedOrigins = this.configService.getOrThrow<string[]>("allowedOrigins");
  }


  // AUTHENTHICATION

  afterInit(server: any) {
    server.use(getWsOriginFilterMiddleware(this.allowedOrigins));
    server.use(getWsSessionMiddleware());
    server.use(getWsAuthMiddleware(this.accounts));
  }

  // LIFECYCLE

  async handleConnection(socket: Socket) {
    socket.join(`user-${socket.data.userId}`);
  }

  @OnEvent("userLogout")
  handleUserLogoutEvent(payload: UserLogoutEvent) {
    const room = `user-${payload.userId}`;
    this.server.in(room).disconnectSockets(true);
  }

  // FEATURES

  public sendMessage(payload: MessageSentEvent) {
    // trasmitting to the sender too, because they may be using multiple devices at the same time
    this.server.to(`user-${payload.senderId}`).emit('message', payload.message);
    for (const receiverId of payload.receiverIds) {
      this.server.to(`user-${receiverId}`).emit('message', payload.message);
    }
  }

  public sendMessageDeletion(payload: MessageDeletedEvent) {
    for (const receiverId of payload.receiverIds) {
      this.server.to(`user-${receiverId}`).emit('messageDeleted', payload.message);
    }
  }

  public sendConversationCleared(payload: ConversationClearedEvent) {
    for (const userId of payload.userIds) {
      this.server.to(`user-${userId}`).emit('reloadConversation', payload.conversationId);
    }
  }

  @SubscribeMessage('acknowledgeConversation')
  async handleAcknowledge(socket: Socket, data: MessageAcknowledgeDto) {
    const userId = socket.data.userId;
    return await this.messagesService.acknowledgeConversationMessages(userId, data.conversationId);
  }

  // This tracks the currently open conversation and is used to suppress push notifications
  @SubscribeMessage("setViewedConversation")
  async handleViewedConversation(socket: Socket, data: { conversationId: number | null }) {
    if (data.conversationId !== null && typeof data.conversationId !== 'number')
      throw new WsException("ConversationId must be a number or null");
    socket.data.viewedConversation = data.conversationId;
  }



  // HELPERS

  public async getActiveUserSockets(userId: number) {
    return await this.server.in(`user-${userId}`).fetchSockets();
  }
}
