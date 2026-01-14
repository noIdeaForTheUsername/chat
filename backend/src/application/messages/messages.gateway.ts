import { ConfigService } from '@nestjs/config';
import { OnGatewayConnection, OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AccountsDomainService } from 'src/domain/accounts/accounts.service';
import { Message } from 'src/domain/messages/entities/message.entity';
import { getSessionMiddleware } from 'src/shared/auth/session.middleware';


// TODO: file a lawsuit for damaging my mental health by not providing any god damn docs for neither auth, cookies, or sessions in websockets
// TODO: write a thankful letter to OpenAI

@WebSocketGateway()
export class MessagesGateway implements OnGatewayInit, OnGatewayConnection {

  @WebSocketServer()
  private server: Server;

  constructor(
    private config: ConfigService,
    private accounts: AccountsDomainService
  ) {}

  afterInit(server: any) {
    // Session middleware
    const sessionMiddleware = getSessionMiddleware(this.config);
    server.use((socket: any, next: any) => {
      sessionMiddleware(socket.request, {} as any, next);
    });

    // Authentication middleware
    server.use(async (socket: any, next: any) => {
      if (!((socket.request as any).session?.userId)) {
        return next(new Error("unauthorized"));
      }

      // Get account
      const userId = (socket.request as any).session.userId;
      const account = await this.accounts.findById(userId);

      // auth checks and errors
      if (!account)
        return next(new Error('not-found.user'));
      if (!account.activated)
        return next(new Error('account-inactive'));

      // success
      socket.data.userId = userId;
      next();
    });
  }

  async handleConnection(socket: Socket) {
    socket.join(`user-${socket.data.userId.id}`);
  }

  public sendMessageToUser(userId: number, message: Message) {
    this.server.to(`user-${userId}`).emit('message', message);
  }
}
