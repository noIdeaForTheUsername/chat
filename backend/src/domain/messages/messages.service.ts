import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, MoreThan, Repository } from 'typeorm';
import { LatestUserMessage } from './entities/latest-user-message.entity';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesDomainService {

  private readonly deletedMessageFields: Partial<Message> = { text: '', repliedId: null };

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(LatestUserMessage)
    private readonly latestUserMessageRepository: Repository<LatestUserMessage>,
  ) {}

  async createMessage(conversationId: number, senderId: number,
    text: string, timestamp: Date, repliedId?: number)
  {
    const message = this.messageRepository.create({
      conversationId,
      senderId,
      text,
      timestamp,
      repliedId: repliedId,
    });
    return await this.messageRepository.save(message);
  }

  async findMostRecentUserMessagesPerConversation(userId: number) {
    const msgs = await this.latestUserMessageRepository.find({
      select: { globalId: true, conversationId: true, senderId: true,
        text: true, timestamp: true, repliedId: true },
      where: { userId: userId },
    });
    return msgs;
  }


  async findMessageById(conversationId: number, messageId: number, exceptionOnNotFound = false) {
    const message = await this.messageRepository.findOneBy({
      conversationId: conversationId,
      globalId: messageId
    });
    if (!message && exceptionOnNotFound)
      throw new NotFoundException('not-found.message');
    return message;
  }

  async findMessagesByIds(conversationId: number, messageIds: number[], exceptionOnNotFound = false) {
    const messages = await this.messageRepository.findBy({
      conversationId: conversationId,
      globalId: In(messageIds)
    });
    return messages;
  }

  async findMessages(conversationId: number, limit: number,
  olderThanStart: boolean, globalIdStartExclusive?: number) {
    let globalIdCondition = undefined;
    if (globalIdStartExclusive !== undefined)
      globalIdCondition = olderThanStart ? LessThan(globalIdStartExclusive) : MoreThan(globalIdStartExclusive);
    
    const orderDirection = olderThanStart ? 'DESC' : 'ASC';
    
    const result = await this.messageRepository.find({
      where: {
        conversationId: conversationId,
        globalId: globalIdCondition,
      },
      order: { globalId: orderDirection },
      take: limit,
    });
    if (orderDirection === 'DESC')
      result.reverse();
    
    return result;
  }

  async deleteMessageById(conversationId: number, messageId: number) {
    const where = { conversationId: conversationId, globalId: messageId };
    await this.messageRepository.update(
      where,
      this.deletedMessageFields
    );
    return await this.messageRepository.find({ where });
  }

  async deleteMultipleMessages(conversationId: number, messageIds: number[], senderId: number) {
    const where = { conversationId: conversationId, globalId: In(messageIds), senderId: senderId };
    await this.messageRepository.update(
      where,
      this.deletedMessageFields
    );
    return await this.messageRepository.find({ where });
  }

  async deleteAllConversationMessages(conversationId: number, senderId: number) {
    const where = { conversationId: conversationId, senderId: senderId };
    await this.messageRepository.update(
      where,
      this.deletedMessageFields
    );
    // return await this.messageRepository.find({ where });
  }
}
