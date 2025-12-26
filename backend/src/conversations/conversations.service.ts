import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Participation } from './entities/participation.entity';
import { Repository } from 'typeorm';
import { UserConversation } from './entities/user-conversation.entity';

@Injectable()
export class ConversationsService {
  constructor(
    // @InjectRepository(Conversation) private readonly conversations: Repository<Conversation>,
    @InjectRepository(Participation) private readonly participations: Repository<Participation>,
    @InjectRepository(UserConversation) private readonly userConversations: Repository<UserConversation>,
  ) {}

  public async getUserConversations(userId: number) {
    return await this.userConversations.find({
      select: { id: true, type: true, participantId: true, accepted: true, notifications: true },
      where: { ownerId: userId }
    });
  }
}
