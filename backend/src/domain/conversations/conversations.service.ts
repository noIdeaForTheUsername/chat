import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConversationType } from './entities/conversation-type.enum';
import { Conversation } from './entities/conversation.entity';
import { Participation } from './entities/participation.entity';
import { UserConversation } from './entities/user-conversation.entity';
import { DataSource, Repository } from 'typeorm';

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
      select: { id: true, type: true, participantId: true, accepted: true, notifications: true },
      where: { ownerId: userId }
    });
  }

  public async findUserConversation(userId: number, conversationId: number, exceptionOnNotFound = false) {
    const conv = await this.userConversations.findOne({
      select: { id: true, type: true, participantId: true, accepted: true, notifications: true },
      where: { ownerId: userId, id: conversationId }
    });
    if (!conv && exceptionOnNotFound) throw new NotFoundException('Conversation not found');
    return conv;
  }

  // CREATING

  public async createDirectConversation(callerId: number, participantId: number) {
    // Checks
    const [sameConversationId] = await Promise.all([
      this.userConversations.findOne({
        select: { id: true },
        where: { ownerId: callerId, participantId: participantId, type: ConversationType.Direct }
      }),
      // this.usersService.profileExists(participantId),
    ]);

    if (sameConversationId !== null)
      throw new ConflictException('A direct conversation between you and the given participant already exists');
    // if (!participantExists)
    //   throw new NotFoundException('Participant user not found');

    // Data operations
    await this.dataSource.manager.transaction(async manager => {
      const conversationObjectObj = manager.create(Conversation, { type: ConversationType.Direct });
      const conversation = await manager.save(conversationObjectObj);

      const callerParticipationObj = manager.create(Participation, {
        userId: callerId,
        conversationId: conversation.id,
        accepted: true,
      });

      const participantParticipationObj = manager.create(Participation, {
        userId: participantId,
        conversationId: conversation.id,
        accepted: false,
      });
      
      try {
        await Promise.all([
          manager.save(callerParticipationObj),
          manager.save(participantParticipationObj),
        ]);
      }
      catch (e) {
        // TODO: (potentially) ERROR HANDLING
        console.log(typeof e);
        throw e;
      }

      return await this.findUserConversation(callerId, conversation.id, true);
    });

  }

  public async createGroupConversation() {  // TODO: implement after Groups are ready on DB

  }

  // UPDATING

  public async acceptConversation(callerId: number, conversationId: number) {
    await this.participations.update(
      { userId: callerId, conversationId: conversationId },
      { accepted: true }
    );
  }

  // DELETING

  public async deleteConversation(conversationId: number) {
    await this.conversations.delete({ id: conversationId });
  }
}
