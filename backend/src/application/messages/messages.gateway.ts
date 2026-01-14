import { ConfigService } from '@nestjs/config';
import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'tls';

@WebSocketGateway({ cookies: true })
export class MessagesGateway implements OnGatewayInit {

  @WebSocketServer()
  private server: Server;

  constructor(
    private config: ConfigService
  ) {}

  afterInit(server: any) {
    server.use((socket: any, next: any) => {
      const token = socket.handshake.auth.token;
    });
  }
}
