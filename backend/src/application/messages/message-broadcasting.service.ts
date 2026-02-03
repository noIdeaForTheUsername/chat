import { Injectable } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { ConversationClearedEvent } from "src/shared/events/conversation-cleared.event";
import { MessageDeletedEvent } from "src/shared/events/message-deleted.event";
import { MessageSentEvent } from "src/shared/events/message-sent.event";
import { MessagesGateway } from "./messages.gateway";
import { ConversationsDomainService } from "src/domain/conversations/conversations.service";
import { ProfilesDomainService } from "src/domain/profiles/profiles.service";

// This service is responsible for deciding and ordering to send real-time updates to users via WebSockets, or Push Notifications when they are offline.

@Injectable()
export class MessageBroadcastingService {

  constructor(
    private messagesGateway: MessagesGateway,
    private eventEmitter: EventEmitter2,
    private conversations: ConversationsDomainService,
    private profiles: ProfilesDomainService
  ) {}

  @OnEvent("messageSent")
  public async sendMessageToUsers(payload: MessageSentEvent) {
    for (const receiverId of payload.receiverIds) {
      if (payload.message.senderId === receiverId) continue;  // skip sender

      const connectedSockets = await this.messagesGateway.getActiveUserSockets(receiverId);
      // Send via a websocket
      if (connectedSockets.length > 0) {
        this.messagesGateway.sendMessage(payload);
      }

      // If no active connection of a user is viewing the conversation, send a push notification
      if (!connectedSockets.some(s => s.data.viewedConversation === payload.message.conversationId)) {
        // Prepare and send push notification
        const conv = await this.conversations.findUserConversation(receiverId, payload.message.conversationId, false);
        if (!conv || !conv.notifications) continue; // user has disabled notifications for this conversation

        const profile = await this.profiles.findUserKnownProfile(receiverId, payload.message.senderId, false);
        if (!profile) continue;

        const senderName = profile.nick || profile.name || profile.login || null;
        if (!senderName) continue;


        const header = "newMessage";
        const message = senderName + ": " +
        (payload.message.text.length > 100 ?
          payload.message.text.substring(0, 97) + "..." :
          payload.message.text);
        
        const tag = `new-message:conversation-${payload.message.conversationId}`;

        this.eventEmitter.emit("pushNotification", {
          userId: receiverId,
          header,
          message,
          tag,
          // clickUrl: `/chats/${payload.message.conversationId}`,
        });
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
