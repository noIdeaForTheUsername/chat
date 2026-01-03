import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { In, LessThan, MoreThan, Repository } from 'typeorm';
import { UserMessage } from './entities/user-message.entity';
import { LatestUserMessage } from './entities/latest-user-message.entity';

@Injectable()
export class MessagesDomainService {

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(UserMessage)
    private readonly userMessageRepository: Repository<UserMessage>,
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

  async findMostRecentUserMessagePerConversation(userId: number) {
    const msgs = await this.latestUserMessageRepository.find({
      select: { globalId: true, conversationId: true, senderId: true,
        text: true, timestamp: true, repliedId: true, numberInConversation: true },
      where: { userId: userId },
    });
    return msgs;
  }

  async findMessage(conversationId: number, messageId: number, exceptionOnNotFound = false) {
    const message = await this.messageRepository.findOneBy({
      conversationId: conversationId,
      globalId: messageId
    });
    if (!message && exceptionOnNotFound)
      throw new NotFoundException('not-found.message');
    return message;
  }

  async findMessages(conversationId: number, limit: number,
  olderThanStart: boolean, globalIdStartExclusive?: number) {
    let globalIdCondition = undefined;
    if (globalIdStartExclusive !== undefined)
      globalIdCondition = olderThanStart ? LessThan(globalIdStartExclusive) : MoreThan(globalIdStartExclusive);
    
    const orderDirection = olderThanStart ? 'DESC' : 'ASC';
    
    return await this.messageRepository.find({
      where: {
        conversationId: conversationId,
        globalId: globalIdCondition,
      },
      order: { globalId: orderDirection },
      take: limit,
    });
  }

  async clearMessageById(conversationId: number, messageId: number) {
    await this.messageRepository.update({
      conversationId: conversationId,
      globalId: messageId
    }, {
      text: '',
      repliedId: null,
    });
  }

  async clearMultipleMessages(conversationId: number, messageIds: number[], senderId: number) {
    this.messageRepository.delete(
      { conversationId: conversationId, globalId: In(messageIds), senderId: senderId }
    )
  }
}
