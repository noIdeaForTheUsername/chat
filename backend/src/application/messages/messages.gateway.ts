import { ConfigService } from '@nestjs/config';
import { OnGatewayConnection, OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import config from 'src/config';
import { AccountsDomainService } from 'src/domain/accounts/accounts.service';
import { Message } from 'src/domain/messages/entities/message.entity';
import { getSessionMiddleware } from 'src/shared/auth/session.middleware';


// TODO: file a lawsuit for damaging my mental health by not providing any god damn docs for neither auth, cookies, or sessions in websockets
// TODO: write a thankful letter to OpenAI

// function getCorsOrigins(config: ConfigService) {
//   return config.get<string[]>('cors.origins');
// }

// useFactory: (config: ConfigService) => ({
//     cors: {
//       methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//       credentials: true,
//       allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
//       origin: config.get<string[]>('cors.origins'),
//     }
//   })

@WebSocketGateway({
  cors: {
    origin: "http://192.168.1.2:8100",
    credentials: true,
  }
})
export class MessagesGateway implements OnGatewayInit, OnGatewayConnection {

  @WebSocketServer()
  private server: Server;

  constructor(
    private config: ConfigService,
    private accounts: AccountsDomainService
  ) {}

  afterInit(server: any) {
    // Session middleware
    const sessionMiddleware = getSessionMiddleware();
    server.use((socket: any, next: any) => {
      console.log('WS cookies:', socket.request.headers.cookie);

      sessionMiddleware(socket.request, {} as any, async () => {
        if (!((socket.request as any).session?.userId)) {
          console.log("no session - rejecting WS!");
          return next(new Error("unauthorized"));
        }

        console.log("passed ws auth phase 1");

        // Get account
        const userId = (socket.request as any).session.userId;
        const account = await this.accounts.findById(userId);

        // auth checks and errors
        if (!account)
          return next(new Error('not-found.user'));
        if (!account.activated)
          return next(new Error('account-inactive'));

        console.log("passed ws auth phase 2");

        // success
        socket.data.userId = userId;
        next();
      });
    });

    // Authentication middleware
    // server.use(async (socket: any, next: any) => {
      
    // });
  }

  async handleConnection(socket: Socket) {
    console.log("handle connection: starting for userId ", socket.data.userId);
    socket.join(`user-${socket.data.userId}`);
  }

  public sendMessageToUser(userId: number, message: Message) {
    console.log("Sending WS message to user ", userId, "with object: ", message);
    this.server.to(`user-${userId}`).emit('message', message);
  }
}
