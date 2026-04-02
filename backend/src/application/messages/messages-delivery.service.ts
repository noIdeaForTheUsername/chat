import { Injectable } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { ConversationClearedEvent } from "src/shared/events/conversation-cleared.event";
import { MessageDeletedEvent } from "src/shared/events/message-deleted.event";
import { MessageSentEvent } from "src/shared/events/message-sent.event";
import { MessagesGateway } from "./messages.gateway";
import { ConversationsDomainService } from "src/domain/conversations/conversations.service";
import { ProfilesDomainService } from "src/domain/profiles/profiles.service";

// Coordinates message delivery via WebSockets and push notifications

@Injectable()
export class MessagesDeliveryService {

  constructor(
    private messagesGateway: MessagesGateway,
    private eventEmitter: EventEmitter2,
    private conversations: ConversationsDomainService,
    private profiles: ProfilesDomainService
  ) {}

  @OnEvent("messageSent")
  public async sendMessageToUsers(payload: MessageSentEvent) {
    
    // websocket transmission
    this.messagesGateway.sendMessage(payload);

    // Send push if user is not viewing this conversation (even with active connections)
    for (const receiverId of payload.receiverIds) {
      const connectedSockets = await this.messagesGateway.getActiveUserSockets(receiverId);
      if (!connectedSockets.some(s => s.data.viewedConversation === payload.message.conversationId)) {
        await this.sendMessagePush(receiverId, payload);
      }
    }
  }

  // Prepares the payload and sends an event to handle by the push notification service
  private async sendMessagePush(receiverId: number, payload: MessageSentEvent) {
    const conversation = await this.conversations.findUserConversation(receiverId, payload.message.conversationId, false);
    if (!conversation || !conversation.notifications) return; // user has disabled notifications for this conversation

    const profile = await this.profiles.findUserKnownProfile(receiverId, payload.message.senderId, false);
    if (!profile) return;

    const senderName = profile.nick || profile.name || profile.phoneNumber;

    const header = "newMessage";
    const message = senderName + ": " +
    (payload.message.text.length > 100 ?  // shorten message to max 100 chars
      payload.message.text.substring(0, 97) + "..." :
      payload.message.text);
    
    const tag = `new-message:conversation-${payload.message.conversationId}`;

    this.eventEmitter.emit("pushNotification", {
      userId: receiverId,
      header,
      message,
      tag,
    });
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
      // No connection or viewingStatus check needed because it doesn't send push
      this.messagesGateway.sendConversationCleared(payload);
    }
  }
}
