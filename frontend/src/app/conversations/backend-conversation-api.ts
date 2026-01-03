import { HttpClient } from "@angular/common/http";
import { inject } from "@angular/core";
import { Conversation } from "./conversation.interface";
import { Message } from "@app/messages/message.interface";
import { map, Observable } from "rxjs";

type ServerMessage = Omit<Message, "timestamp"> & { timestamp: string };

export class BackendConversationApi {
  private readonly http = inject(HttpClient);
  private readonly userId: number;
  
  constructor(userId: number) {
    this.userId = userId;
  }

  getUserConversations() {
    return this.http.get<Conversation[]>("/conversations");
  }

  getConversationById(conversationId: number) {
    return this.http.get<Conversation>(`/conversations/${conversationId}`);
  }

  // getConversationByParticipantId(participantId: number, participantType: "user" | "group" = "user"): Observable<Conversation> {
  //   return this.http.get<Conversation>(`/conversations/participant/${participantType}/${participantId}`);
  // }

  getMessagePreviews(): Observable<Map<number, Message | null>> {
    return this.http.get<ServerMessage[]>("/message-previews").pipe(
      map((serverMessages: ServerMessage[]) => {
        let messageMap = new Map<number, Message | null>();
        serverMessages.forEach((msg) => {
          let msgConverted: Message = {
            ...msg,
            timestamp: new Date(msg.timestamp)
          };
          messageMap.set(msg.conversationId, msgConverted);
        });
        return messageMap;
      })
    );
  }

  createDirectConversation(participantId: number) {
    return this.http.post<Conversation>("/conversations", { type: "direct", participantId });
  }

  acceptConversation(conversationId: number) {
    return this.http.post(`/conversations/${conversationId}/accept`, {});
  }

  clearConversationMessages(conversationId: number) {
    return this.http.delete(`/conversations/${conversationId}/messages/all`);
  }
}
