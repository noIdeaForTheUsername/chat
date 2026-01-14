import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from "socket.io-client";
import { ServerMessage, serverMessageToMessage } from '../message-utils';
import { map, Observable, Subject } from 'rxjs';
import { Message } from '../message.interface';
import { environment } from '@src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MsgSocketService implements OnDestroy {
  
  private readonly socket: Socket;

  private messageSubject = new Subject<ServerMessage>();
  public messages$: Observable<Message> = this.messageSubject.asObservable().pipe(
    map((msg: ServerMessage) => serverMessageToMessage(msg))
  );

  constructor() {
    this.socket = io(environment.apiUrl, {
      withCredentials: true,
    });

    this.socket.on("message", (value: ServerMessage) => {
      console.log("Received message from server:", value);
      this.messageSubject.next(value);
    })
  }

  ngOnDestroy() {
    this.socket.disconnect();
    this.messageSubject.complete();
  }
}
