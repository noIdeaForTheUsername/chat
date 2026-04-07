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
    @InjectRepository(Conversation) private readonly conversations: Repository<Conversation>,
    @InjectRepository(Participation) private readonly participations: Repository<Participation>,
    @InjectRepository(UserConversation) private readonly userConversations: Repository<UserConversation>,
  ) {}

  // GETTING

  public async findUserConversations(userId: number) {
    return await this.userConversations.find({
      select: { id: true, type: true, participantId: true, newestReadMessageId: true },
      where: { ownerId: userId }
    });
  }

  public async findUserConversation(userId: number, conversationId: number, exceptionOnNotFound = false) {
    const conv = await this.userConversations.findOne({
      select: { id: true, type: true, participantId: true, },
      where: { id: conversationId, ownerId: userId }
    });
    if (!conv && exceptionOnNotFound) throw new NotFoundException('not-found.conversation');
    return conv;
  }

  public async findDirectConversationBetweenUsers(user1Id: number, user2Id: number) {
    return await this.userConversations.findOne({
      where: { ownerId: user1Id, participantId: user2Id, type: ConversationType.DIRECT }
    });
  }
  

  // CREATING

  public async createConversation(type: ConversationType) {
    const conversationObjectObj = this.conversations.create({ type });
    return await this.conversations.save(conversationObjectObj);
  }

  public async createParticipation(userId: number, conversationId: number) {
    const participationObj = this.participations.create({
      userId: userId,
      conversationId: conversationId,
    });
    return await this.participations.save(participationObj);
  }

  
  // UPDATING


  public async setNewestReadMessage(userId: number, conversationId: number, messageId: number) {
    const result = await this.participations.update(
      { userId: userId, conversationId: conversationId },
      { newestReadMessageId: messageId }
    );
    if (result.affected === 0)
      throw new NotFoundException('not-found.conversation');
  }

  public async ackowledgeConversation(userId: number, conversationId: number) {
    const result = await this.participations.query(
      "UPDATE participations" +
      " SET newest_read_message_id = (SELECT MAX(global_id) FROM messages WHERE conversation_id = $1)" +
      " WHERE user_id = $2 AND conversation_id = $1",
      [conversationId, userId]
    );
    if (result.affected === 0)
      throw new NotFoundException('not-found.conversation');
  }
}
