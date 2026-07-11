import { Injectable } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { ProfilesDomainService } from "src/domain/profiles/profiles.service";
import { ConversationClearedEvent } from "src/shared/events/conversation-cleared.event";
import { FilesSentEvent } from "src/shared/events/messages/files-sent.event";
import { MessageDeletedEvent } from "src/shared/events/messages/message-deleted.event";
import { MessageSentEvent } from "src/shared/events/messages/message-sent.event";
import { PushNotifcationEvent } from "src/shared/events/push-notification.event";
import { StringTemplate } from "../shared/strings/string-params";
import { MessagesGateway } from "./messages.gateway";

// Coordinates message delivery via WebSockets and push notifications

@Injectable()
export class MessagesDeliveryService {

  constructor(
    private messagesGateway: MessagesGateway,
    private eventEmitter: EventEmitter2,
    private profiles: ProfilesDomainService
  ) {}

  @OnEvent("messageSent")
  public async sendTextMessageToUsers(payload: MessageSentEvent) {
    
    // websocket transmission
    this.messagesGateway.sendMessage(payload);

    if (!payload.message.text)
      return;

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

        await this.sendPush(receiverId, payload.message.conversationId, notificationMessage);
      }
    }
  }

  @OnEvent("filesSent")
  public async sendFileMessageToUsers(payload: FilesSentEvent) {
    
    // websocket transmission
    this.messagesGateway.sendFile(payload);

    
    if (payload.messageContainsText)
      return;  // no notification if message contains text (the text part of the message already triggers a push notification)

    // Send only if user is not viewing this conversation (even with active connections)
    for (const receiverId of payload.receiverIds) {
      const connectedSockets = await this.messagesGateway.getActiveUserSockets(receiverId);
      if (!connectedSockets.some(s => s.data.viewedConversation === payload.conversationId)) {
        const profile = await this.profiles.findUserKnownProfile(receiverId, payload.senderId, false);
        if (!profile)
          return;

        // Create notification message
        const senderName = profile.nick || profile.name || profile.phoneNumber;
        const notificationMessage = { schema: "$: filesSentMessage ($) 📄", params: [senderName, payload.filesInfo.length] };
        this.sendPush(receiverId, payload.conversationId, notificationMessage);
      }
    }
  }


  // Prepares the payload and sends an event to handle by the push notification service
  private async sendPush(receiverId: number, conversationId: number, message: string | StringTemplate) {
    let eventPayload: PushNotifcationEvent = {
      userId: receiverId,
      header: { schema: "newMessage" },
      message,
      tag: `new-message:conversation-${conversationId}`
    };

    this.eventEmitter.emit("pushNotification", eventPayload);
  }

  @OnEvent("messageDeleted")
  public async sendMessageDeletionToUsers(payload: MessageDeletedEvent) {
    for (const receiverId of payload.receiverIds) {
      this.messagesGateway.sendMessageDeletion(payload);
    }
  }

  @OnEvent("conversationCleared")
  public async sendConversationClearedToUsers(payload: ConversationClearedEvent) {
    for (const userId of payload.conversationParticipants) {
      // No connection or viewingStatus check needed because it doesn't send push
      this.messagesGateway.sendConversationCleared(payload);
    }
  }
}
