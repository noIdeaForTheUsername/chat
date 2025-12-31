import { HttpClient } from "@angular/common/http";
import { inject } from "@angular/core";
import { Message } from "../message.interface";
import { map } from "rxjs";

type ServerMessage = Omit<Message, "timestamp"> & { timestamp: string };

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
        return serverMessages.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      })
    );
  }

  sendMessage(conversationId: number, text: string, timestamp: Date) {
    return this.http.post(`/conversations/${conversationId}/messages`, {
      conversationId,
      text,
      timestamp
    });
  }
}
