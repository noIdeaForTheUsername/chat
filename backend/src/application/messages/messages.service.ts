import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConversationsDomainService } from 'src/domain/conversations/conversations.service';
import { Message } from 'src/domain/messages/entities/message.entity';
import { MessagesDomainService } from 'src/domain/messages/messages.service';
import { ConversationClearedEvent } from 'src/shared/events/conversation-cleared.event';
import { MessageDeletedEvent } from 'src/shared/events/messages/message-deleted.event';
import { MessageSentEvent } from 'src/shared/events/messages/message-sent.event';
import { ActionsThrottlerService } from '../shared/actions-rate-limiting/actions-throttler.service';
import { RateLimitedAction } from '../shared/actions-rate-limiting/rate-limited-action.interface';
import { NotBlockingParticipantsService } from '../shared/not-blocking-participants/not-blocking-participants.service';

const MESSAGE_SENDING_LIMIT: RateLimitedAction = {
  name: 'MESSAGE_SEND',
  limit: 10,
  ttl: 20 * 1000,
  logExceeded: false,
}
const MESSAGE_SENDING_LIMIT_2: RateLimitedAction = {
  name: 'MESSAGE_SEND_2',
  limit: 60,
  ttl: 4 * 60 * 1000,
  logExceeded: false,
}


@Injectable()
export class MessagesService {

  constructor(
    private messagesDomainService: MessagesDomainService,
    private conversationsDomainService: ConversationsDomainService,
    private eventEmitter: EventEmitter2,
    private notBlockingParticipantsService: NotBlockingParticipantsService,
    private readonly actionsThrottler: ActionsThrottlerService
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
    return await this.messagesDomainService.findMostRecentUserMessagesPerConversation(callerId);
  }

  async sendMessage(callerId: number, conversationId: number,
    text: string, repliedId?: number)
  {
    this.actionsThrottler.incrementAndThrow(MESSAGE_SENDING_LIMIT, callerId.toString());
    this.actionsThrottler.incrementAndThrow(MESSAGE_SENDING_LIMIT_2, callerId.toString());

    // assert this conv exists and the caller is a member of it
    await this.conversationsDomainService.findUserConversation(callerId, conversationId, true);
    
    const timestamp = new Date();

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
    // No need to verify participation manually - setNewestReadMessage only modifies the Participation record
    return await this.conversationsDomainService.ackowledgeConversation(callerId, conversationId);
  }

  async deleteMessageById(callerId: number, conversationId: number, messageId: number) {
    // assert this conv exists and the caller is a member of it
    await this.conversationsDomainService.findUserConversation(callerId, conversationId, true);

    const message = await this.messagesDomainService.findMessageById(conversationId, messageId, true);
    if (!message)
      throw new NotFoundException('not-found.message');

    if (message.senderId !== callerId)
      throw new ForbiddenException("cannot-delete-not-own-message");
    
    const deleted = await this.messagesDomainService.deleteMessageById(conversationId, messageId);
    await this.sendRealTimeDeletion(deleted);
  }

  async deleteMultipleMessages(callerId: number, conversationId: number, messageIds: number[]) {
    // assert this conv exists and the caller is a member of it
    await this.conversationsDomainService.findUserConversation(callerId, conversationId, true);

    const deleted = await this.messagesDomainService.deleteMultipleMessages(conversationId, messageIds, callerId);
    await this.sendRealTimeDeletion(deleted);
  }

  async deleteAllConversationMessages(callerId: number, conversationId: number) {
    // assert this conv exists and the caller is a member of it
    await this.conversationsDomainService.findUserConversation(callerId, conversationId, true);

    await Promise.all([
      this.messagesDomainService.deleteAllConversationMessages(conversationId, callerId),

    ]);
    this.eventEmitter.emit("conversationCleared", new ConversationClearedEvent(
      callerId,
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
