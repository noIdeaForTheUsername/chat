import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Message } from "../message.interface";
import { map } from "rxjs";
import { ServerMessage, serverMessageToMessage } from "../message-utils";


@Injectable({
  providedIn: 'root',
})
export class BackendMessageApi {

  private readonly http = inject(HttpClient);

  getConversationMessages(conversationId: number, limit: number, older = true,
    startMessageGlobalId?: number
  ) {
    return this.http.get<ServerMessage[]>(`/conversations/${conversationId}/messages`, {
      params: {
        globalIdStart: startMessageGlobalId ?? '',
        older: older.toString(),
        limit: limit.toString()
      }
    }).pipe(
      map((serverMessages: ServerMessage[]) => {
        return serverMessages.map(serverMessageToMessage);
      })
    );
  }

  getMessageById(messageId: number, conversationId: number) {
    return this.http.get<ServerMessage>(`/conversations/${conversationId}/messages/${messageId}`).pipe(
      map(serverMessageToMessage)
    );
  }

  getMessagesByIds(messageIds: number[], conversationId: number) {
    return this.http.get<ServerMessage[]>(`/conversations/${conversationId}/messages/batch`, {
      params: {
        ids: messageIds.join(',')
      }
    }).pipe(
      map(serverMessages => serverMessages.map(serverMessageToMessage))
    );
  }

  sendMessage(conversationId: number, text: string, timestamp: Date, repliedId?: number) {
    return this.http.post(`/conversations/${conversationId}/messages`, {
      conversationId,
      text,
      timestamp,
      repliedId,
    });
  }

  deleteMessage(messageId: number, conversationId: number) {
    return this.http.delete(`/conversations/${conversationId}/messages/${messageId}`);
  }

  deleteMultipleMessages(messageIds: number[], conversationId: number) {
    return this.http.delete(`/conversations/${conversationId}/messages`, {
      body: {
        ids: messageIds
      }
    });
  }

  // MASS MESSAGE DELETION IN CONVERSATION SERVICE
}
