import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConversationsDomainService } from 'src/domain/conversations/conversations.service';
import { MessagesDomainService } from 'src/domain/messages/messages.service';
import { Transactional } from 'typeorm-transactional';
import { MessagesGateway } from './messages.gateway';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessageSentEvent } from 'src/shared/events/message-sent.event';
import { NotBlockingParticipantsService } from '../shared/not-blocking-participants/not-blocking-participants.service';
import { Message } from 'src/domain/messages/entities/message.entity';
import { Conversation } from 'src/domain/conversations/entities/conversation.entity';
import { MessageDeletedEvent } from 'src/shared/events/message-deleted.event';
import { ConversationClearedEvent } from 'src/shared/events/conversation-cleared.event';

@Injectable()
export class MessagesService {

  // variables below are used in checks the user-provided timestamp
  // is not too far from the actual current time
  // 1. When the message arrives to the server later than the provided timestamp
  private readonly lateMessageThresholdMs = 3 * 60 * 1000;
  // 2. When the message arrives to the server earlier than the provided timestamp
  private readonly earlyMessageThresholdMs = 1 * 60 * 1000;

  constructor(
    private messagesDomainService: MessagesDomainService,
    private conversationsDomainService: ConversationsDomainService,
    private eventEmitter: EventEmitter2,
    private notBlockingParticipantsService: NotBlockingParticipantsService,
  ){}

  async getConversationMessages(callerId: number, conversationId: number, limit: number,
    globalIdStart?: number, olderThanStart: boolean = true) {
    // assert this conv exists and the caller is a member of it
    await this.conversationsDomainService.findUserConversation(callerId, conversationId, true);

    return await this.messagesDomainService.findMessages(
      conversationId, limit, olderThanStart, globalIdStart);
  }

  async getMessageById(callerId: number, conversationId: number, messageId: number) {
    // assert this conv exists and the caller is a member of it
    await this.conversationsDomainService.findUserConversation(callerId, conversationId, true);
    
    return await this.messagesDomainService.findMessageById(conversationId, messageId, true);
  }
  async getMessagesByIds(callerId: number, conversationId: number, messageIds: number[]) {
    // assert this conv exists and the caller is a member of it
    await this.conversationsDomainService.findUserConversation(callerId, conversationId, true);
    
    return await this.messagesDomainService.findMessagesByIds(conversationId, messageIds, true);
  }

  async getRecentMessagePreviews(callerId: number) {
    return await this.messagesDomainService.findMostRecentUserMessagePerConversation(callerId);
  }

  async sendMessage(callerId: number, conversationId: number,
    text: string, timestamp: Date, repliedId?: number)
  {
    // assert this conv exists and the caller is a member of it
    await this.conversationsDomainService.findUserConversation(callerId, conversationId, true);

    const now = new Date().getTime();
    const messageTime = timestamp.getTime();
    const messageLate = now - messageTime > this.lateMessageThresholdMs;
    const messageInTheFuture = messageTime - now > this.earlyMessageThresholdMs;
    if (messageLate || messageInTheFuture)
      throw new BadRequestException("bad-timestamp");  

    // Sending
    const sent = await this.messagesDomainService.createMessage(
      conversationId, callerId, text, timestamp, repliedId);
    // ack msg and find participants for websocket message sending
    const [_, participantIds] = await Promise.all([
      this.conversationsDomainService.setNewestReadMessage(callerId, conversationId, sent.globalId),
      this.notBlockingParticipantsService.getNotBlockingParticipantsIds(conversationId, callerId)
    ]);

    // send WebSocket message to participants
    this.eventEmitter.emit("messageSent", new MessageSentEvent(callerId, participantIds, sent));

    return sent;
  }

  async acknowledgeConversationMessages(callerId: number, conversationId: number) {
    const maxIdMsg = await this.messagesDomainService.findMostRecentMessageInConversation(conversationId);
    if (maxIdMsg === null) return;  // no messages in conv, ignore and return success

    // No need to verify participation manually - setNewestReadMessage only modifies the Participation record
    return await this.conversationsDomainService.setNewestReadMessage(callerId, conversationId, maxIdMsg.globalId);
  }

  async deleteMessageById(callerId: number, conversationId: number, messageId: number) {
    // assert this conv exists and the caller is a member of it
    await this.conversationsDomainService.findUserConversation(callerId, conversationId, true);

    const message = await this.messagesDomainService.findMessageById(conversationId, messageId, true);
    if (!message)
      throw new NotFoundException('not-found.message');

    if (message.senderId !== callerId)
      throw new ForbiddenException("cannot-delete-not-own-message");
    
    const deleted = await this.messagesDomainService.clearMessageById(conversationId, messageId);
    await this.sendRealTimeDeletion(deleted);
  }

  async deleteMultipleMessages(callerId: number, conversationId: number, messageIds: number[]) {
    // assert this conv exists and the caller is a member of it
    await this.conversationsDomainService.findUserConversation(callerId, conversationId, true);

    const deleted = await this.messagesDomainService.clearMultipleMessages(conversationId, messageIds, callerId);
    await this.sendRealTimeDeletion(deleted);
  }

  async deleteAllConversationMessages(callerId: number, conversationId: number) {
    // assert this conv exists and the caller is a member of it
    await this.conversationsDomainService.findUserConversation(callerId, conversationId, true);

    await this.messagesDomainService.clearAllConversationMessages(conversationId, callerId);
    this.eventEmitter.emit("conversationCleared", new ConversationClearedEvent(
      await this.notBlockingParticipantsService.getNotBlockingParticipantsIds(conversationId, callerId),
      conversationId));
  }

  // This function assumes that all deleted messages (passed in the parameter) belong to the same user and conversation!
  private async sendRealTimeDeletion(deleted: Message | Message[]) {
    if (deleted instanceof Array) {
      if (deleted.length === 0) return;
      const first = deleted[0];

      const participantIds = await this.notBlockingParticipantsService.getNotBlockingParticipantsIds(
        first.conversationId, first.senderId);
      
      for (const message of deleted) {
        this.eventEmitter.emit("messageDeleted", new MessageDeletedEvent(participantIds, message));
      }
    }
    else {
      const participantIds = await this.notBlockingParticipantsService.getNotBlockingParticipantsIds(
        deleted.conversationId, deleted.senderId);
      this.eventEmitter.emit("messageDeleted", new MessageDeletedEvent(participantIds, deleted));
    }
  }
}
