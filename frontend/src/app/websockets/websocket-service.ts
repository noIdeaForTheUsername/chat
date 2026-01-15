import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from "socket.io-client";
import { ServerMessage, serverMessageToMessage } from '../messages/message-utils';
import { map, Observable, Subject } from 'rxjs';
import { Message } from '../messages/message.interface';
import { environment } from '@src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService implements OnDestroy {
  
  private socket: Socket;

  private messageSubject = new Subject<ServerMessage>();
  public messages$: Observable<Message> = this.messageSubject.asObservable().pipe(
    map((msg: ServerMessage) => serverMessageToMessage(msg))
  );

  private messageUpdatesSubject = new Subject<ServerMessage>();
  public messageUpdates$: Observable<Message> = this.messageUpdatesSubject.asObservable().pipe(
    map((msg: ServerMessage) => serverMessageToMessage(msg))
  );

  private reloadConversationSubject = new Subject<number>();
  public reloadConversation$: Observable<number> = this.reloadConversationSubject.asObservable();


  constructor() {
    this.socket = io(environment.apiUrl, {
      withCredentials: true,
    });

    this.socket.on("message", (value: ServerMessage) => {
      this.messageSubject.next(value);
    });

    this.socket.on("messageDeleted", (value: ServerMessage) => {
      console.log("msg delete WS received:", value);
      this.messageUpdatesSubject.next(value);
    });

    this.socket.on("reloadConversation", (value: number) => {
      console.log("Received reloadConversation for conversation", value);
      this.reloadConversationSubject.next(value);
    });
  }

  reconnect() {
    if (!this.socket.connected)
      this.socket.connect();
  }

  acknowledgeConversationMessages(conversationId: number) {
    console.log("calling WS ACK for conversation", conversationId);
    this.socket.emit("acknowledgeConversation", { conversationId });
  }

  ngOnDestroy() {
    this.socket.disconnect();
    this.messageSubject.complete();
    this.messageUpdatesSubject.complete();
    this.reloadConversationSubject.complete();
  }
}
