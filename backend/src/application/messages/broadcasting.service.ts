import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { ConversationClearedEvent } from "src/shared/events/conversation-cleared.event";
import { MessageDeletedEvent } from "src/shared/events/message-deleted.event";
import { MessageSentEvent } from "src/shared/events/message-sent.event";
import { MessagesGateway } from "./messages.gateway";

// This service is responsible for sending real-time updates to users via WebSockets, or Push Notifications when they are offline.

@Injectable()
export class BroadcastingService {

  constructor(
    private messagesGateway: MessagesGateway
  ) {}

  @OnEvent("messageSent")
  public async sendMessageToUsers(payload: MessageSentEvent) {
    for (const receiverId of payload.receiverIds) {
      if (payload.message.senderId === receiverId) continue;  // skip sender

      const connected = await this.messagesGateway.getUserConnected(receiverId);
      if (connected) {
        this.messagesGateway.sendMessage(payload);
      }
      else {
        // Push notification
      }
    }
  }

  @OnEvent("messageDeleted")
  public async sendMessageDeletionToUsers(payload: MessageDeletedEvent) {
    for (const receiverId of payload.receiverIds) {
      this.messagesGateway.sendMessageDeletion(payload);
    }
  }

  @OnEvent("conversationCleared")
  public async sendConversationClearedToUsers(payload: ConversationClearedEvent) {
    for (const userId of payload.userIds) {
      // No connection check needed because it's pointless to send a push notification here
      this.messagesGateway.sendConversationCleared(payload);
    }
  }
}

