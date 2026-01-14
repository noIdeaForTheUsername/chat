import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConversationType } from './entities/conversation-type.enum';
import { Conversation } from './entities/conversation.entity';
import { Participation } from './entities/participation.entity';
import { UserConversation } from './entities/user-conversation.entity';
import { DataSource, Not, Repository } from 'typeorm';

@Injectable()
export class ConversationsDomainService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Conversation) private readonly conversations: Repository<Conversation>,
    @InjectRepository(Participation) private readonly participations: Repository<Participation>,
    @InjectRepository(UserConversation) private readonly userConversations: Repository<UserConversation>,
  ) {}

  // GETTING

  public async findUserConversations(userId: number) {
    return await this.userConversations.find({
      select: { id: true, type: true, participantId: true, accepted: true, notifications: true, newestReadMessageId: true },
      where: { ownerId: userId }
    });
  }

  public async findUserConversation(userId: number, conversationId: number, exceptionOnNotFound = false) {
    const conv = await this.userConversations.findOne({
      select: { id: true, type: true, participantId: true, accepted: true, notifications: true },
      where: { ownerId: userId, id: conversationId }
    });
    if (!conv && exceptionOnNotFound) throw new NotFoundException('not-found.conversation');
    return conv;
  }

  public async findDirectConversationBetweenUsers(user1Id: number, user2Id: number) {
    return await this.userConversations.findOne({
      where: { ownerId: user1Id, participantId: user2Id, type: ConversationType.Direct }
    });
  }

  public async findConversationParticipantsIds(conversationId: number, excludeParticipantId?: number) {
    const participations = await this.participations.find({
      select: { userId: true },
      where: {
        conversationId: conversationId,
        userId: excludeParticipantId ? Not(excludeParticipantId) : undefined
      }
    });
    return participations.map(p => p.userId);
  }

  // CREATING

  public async createConversation(type: ConversationType) {
    const conversationObjectObj = this.conversations.create({ type });
    return await this.conversations.save(conversationObjectObj);
  }

  public async createParticipation(userId: number, conversationId: number, accepted = false) {
    const participationObj = this.participations.create({
      userId: userId,
      conversationId: conversationId,
      accepted: accepted,
    });
    return await this.participations.save(participationObj);
  }

  public async createGroupConversation() {  //TODO:
    throw new BadRequestException('Not implemented yet');
  }

  // UPDATING

  public async acceptConversation(userId: number, conversationId: number) {
    const result = await this.participations.update(
      { userId: userId, conversationId: conversationId },
      { accepted: true }
    );
    if (result.affected === 0)
      throw new NotFoundException('not-found.conversation');
  }

  public async setNewestReadMessage(userId: number, conversationId: number, messageId: number) {
    const result = await this.participations.update(
      { userId: userId, conversationId: conversationId },
      { newestReadMessageId: messageId }
    );
    if (result.affected === 0)
      throw new NotFoundException('not-found.conversation');
  }
}
