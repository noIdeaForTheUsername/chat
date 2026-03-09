import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from "socket.io-client";
import { ServerMessage, serverMessageToMessage } from '../messages/message-utils';
import { map, Observable, Subject } from 'rxjs';
import { Message } from '../messages/message.interface';
import { environment } from '@src/environments/environment';
import { Capacitor } from '@capacitor/core';

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

  private reconnectedSubject = new Subject<void>();
  public reconnected$: Observable<void> = this.reconnectedSubject.asObservable();


  constructor() {
    this.socket = io(
      Capacitor.isNativePlatform() ? environment.capacitorSocketIoUrl : environment.socketIoUrl,
      {
        path: environment.socketIoPath,
        withCredentials: true,
    });

    this.socket.on("message", (value: ServerMessage) => {
      this.messageSubject.next(value);
    });

    this.socket.on("messageDeleted", (value: ServerMessage) => {
      this.messageUpdatesSubject.next(value);
    });

    this.socket.on("reloadConversation", (value: number) => {
      this.reloadConversationSubject.next(value);
    });

    this.socket.io.on("reconnect", () => {
      console.log("Websocket reconnected");
      this.reconnectedSubject.next();
    });
  }

  reconnect() {
    if (!this.socket.connected)
      this.socket.connect();
  }

  acknowledgeConversationMessages(conversationId: number) {
    this.socket.emit("acknowledgeConversation", { conversationId });
  }

  setViewedConversation(conversationId: number | null) {
    this.socket.emit("setViewedConversation", { conversationId });
  }

  ngOnDestroy() {
    this.socket.disconnect();
    this.messageSubject.complete();
    this.messageUpdatesSubject.complete();
    this.reloadConversationSubject.complete();
    this.reconnectedSubject.complete();
  }
}
