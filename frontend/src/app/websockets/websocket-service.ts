import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from "socket.io-client";
import { ServerMessage, serverMessageToMessage } from '../messages/message-utils';
import { map, Observable, Subject } from 'rxjs';
import { Message } from '../messages/message.interface';
import { environment } from '@src/environments/environment';
import { Capacitor } from '@capacitor/core';
import { BaseFileInfo } from '../files/file-types';
import { thumbsUpSharp } from 'ionicons/icons';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService implements OnDestroy {
  
  private socket: Socket;

  private messageSubject = new Subject<ServerMessage>();
  public messages$: Observable<Message> = this.messageSubject.asObservable().pipe(
    map((msg: ServerMessage) => serverMessageToMessage(msg))
  );

  private filesSubject = new Subject<BaseFileInfo[]>();
  public files$: Observable<BaseFileInfo[]> = this.filesSubject.asObservable();

  private messageUpdatesSubject = new Subject<ServerMessage>();
  public messageUpdates$: Observable<Message> = this.messageUpdatesSubject.asObservable().pipe(
    map((msg: ServerMessage) => serverMessageToMessage(msg))
  );

  private reloadConversationSubject = new Subject<number>();
  public reloadConversation$: Observable<number> = this.reloadConversationSubject.asObservable();

  private reconnectedSubject = new Subject<void>();
  public reconnected$: Observable<void> = this.reconnectedSubject.asObservable();
  private firstConnection = true;
  private attemptedReconnectionAfterDisconnectionByServer = false;


  constructor() {
    this.socket = io(
      Capacitor.isNativePlatform() ? environment.capacitorSocketIoUrl : environment.socketIoUrl,
      {
        path: environment.socketIoPath,
        withCredentials: true,
    });

    // (RE)CONNECT AND DISCONNECT

    this.socket.on("connect", () => {
      console.log("websocket connected!");
      if (!this.firstConnection) {
        console.log("reconnection detected");
        this.reconnectedSubject.next();
      }
      this.firstConnection = false;
    });
    this.socket.on("disconnect", (reason) => {
      // This snippet detects "manual" disconnections by the server (they are done for example when
      // a different device of the same user log outs, for security) and tries reconnection
      if (reason === "io server disconnect") {
        console.log("Websocket disconnected by server");
        if (this.attemptedReconnectionAfterDisconnectionByServer) {
          console.error("Continuous websocket disconnections by the server. Reconnection attempts stopped.")
          return;
        }
        this.attemptedReconnectionAfterDisconnectionByServer = true;

        // attempt reconnection after a short random delay
        setTimeout(() => { 
          this.socket.connect();
        }, Math.random() * 1000);
        // if in less than 10s the server manually disconnects client again,
        // don't make more attempts (this function will just return)
        setTimeout(() => {
          this.attemptedReconnectionAfterDisconnectionByServer = false;
        }, 10_000);
      }
    });


    // APPLICATION EVENTS (SERVER->CLIENT)


    this.socket.on("message", (value: ServerMessage) => {
      this.messageSubject.next(value);
    });

    this.socket.on("files", (value: BaseFileInfo[]) => {
      this.filesSubject.next(value);
    }) 

    this.socket.on("messageDeleted", (value: ServerMessage) => {
      this.messageUpdatesSubject.next(value);
    });

    this.socket.on("reloadConversation", (value: number) => {
      this.reloadConversationSubject.next(value);
    });
  }

  reconnect() {
    if (!this.socket.connected)
      this.socket.connect();
  }
  getConnected() {
    return this.socket.connected;
  }

  // APPLICATION EVENTS (CLIENT->SERVER)

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
