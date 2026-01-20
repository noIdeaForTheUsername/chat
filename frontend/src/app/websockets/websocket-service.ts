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
    this.socket = io(environment.socketIoUrl, {
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

    // this.socket.on("connect_error", (err: any) => {
    //   // the reason of the error, for example "xhr poll error"
    //   console.error(err.message);

    //   // some additional description, for example the status code of the initial HTTP response
    //   console.error(err.description);

    //   // some additional context, for example the XMLHttpRequest object
    //   console.error(err.context);
    // });
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
  }
}
