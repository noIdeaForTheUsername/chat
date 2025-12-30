import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { LessThan, MoreThan, Repository } from 'typeorm';
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
        text: true, timestamp: true, repliedId: true },
      where: { userId: userId },
    });
    return msgs;
  }

  async findMessages(conversationId: number, globalIdStartExclusive: number, olderThanStart: boolean, limit: number) {
    return await this.messageRepository.find({
      where: {
        conversationId: conversationId,
        globalId: olderThanStart ? LessThan(globalIdStartExclusive) : MoreThan(globalIdStartExclusive),
      },
      order: { timestamp: olderThanStart ? "DESC" : "ASC" },
      take: limit,
    });
  }
}
