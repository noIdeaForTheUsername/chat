import { BadRequestException, Injectable } from '@nestjs/common';
import { ConversationsDomainService } from 'src/domain/conversations/conversations.service';
import { MessagesDomainService } from 'src/domain/messages/messages.service';
import { Transactional } from 'typeorm-transactional';

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
    
    return await this.messagesDomainService.findMessage(conversationId, messageId, true);
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

    const sent = await this.messagesDomainService.createMessage(
      conversationId, callerId, text, timestamp, repliedId);
    return sent.globalId;
  }
}
