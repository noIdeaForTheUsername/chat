import { Injectable } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { ConversationClearedEvent } from "src/shared/events/conversation-cleared.event";
import { MessageDeletedEvent } from "src/shared/events/messages/message-deleted.event";
import { MessageSentEvent } from "src/shared/events/messages/message-sent.event";
import { MessagesGateway } from "./messages.gateway";
import { ConversationsDomainService } from "src/domain/conversations/conversations.service";
import { ProfilesDomainService } from "src/domain/profiles/profiles.service";
import { FilesSentEvent } from "src/shared/events/messages/files-sent.event";

// Coordinates message delivery via WebSockets and push notifications

@Injectable()
export class MessagesDeliveryService {

  constructor(
    private messagesGateway: MessagesGateway,
    private eventEmitter: EventEmitter2,
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
        // Get the profile of the sender as known by the receiver
        const profile = await this.profiles.findUserKnownProfile(receiverId, payload.senderId, false);
        if (!profile)
          return;
        // Create notification message
        const senderName = profile.nick || profile.name || profile.phoneNumber;
        const text = payload.message.text;
        const notificationMessage = senderName + ": " +
          (text.length > 100  // shorten message to max 100 chars
            ? text.substring(0, 97) + "..."
            : text);

        await this.sendMessagePush(receiverId, payload.message.conversationId, notificationMessage);
      }
    }
  }

  @OnEvent("filesSent")
  public async sendFileToUsers(payload: FilesSentEvent) {
    
    // websocket transmission
    this.messagesGateway.sendFile(payload);

    // Send push if user is not viewing this conversation (even with active connections)
    for (const receiverId of payload.receiverIds) {
      const connectedSockets = await this.messagesGateway.getActiveUserSockets(receiverId);
      if (!connectedSockets.some(s => s.data.viewedConversation === payload.conversationId)) {
        const profile = await this.profiles.findUserKnownProfile(receiverId, payload.senderId, false);
        if (!profile)
          return;
        // Create notification message
        const senderName = profile.nick || profile.name || profile.phoneNumber;
        const notificationMessage = [senderName + ": ", "filesSentMessage"];
        this.sendMessagePush(receiverId, payload.conversationId, notificationMessage);
      }
    }
  }


  // Prepares the payload and sends an event to handle by the push notification service
  private async sendMessagePush(receiverId: number, conversationId: number, message: string | string[]) {
    const header = "newMessage"; 
    const tag = `new-message:conversation-${conversationId}`;

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
