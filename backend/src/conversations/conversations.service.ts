import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Participation } from './entities/participation.entity';
import { Repository } from 'typeorm';
import { UserConversation } from './entities/user-conversation.entity';
import { DataSource } from 'typeorm/browser';
import { ConversationType } from './entities/conversation-type.enum';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ConversationsService {
  constructor(
    private dataSource: DataSource,
    private usersService: UsersService,
    @InjectRepository(Conversation) private readonly conversations: Repository<Conversation>,
    @InjectRepository(Participation) private readonly participations: Repository<Participation>,
    @InjectRepository(UserConversation) private readonly userConversations: Repository<UserConversation>,
  ) {}

  public async getUserConversations(userId: number) {
    return await this.userConversations.find({
      select: { id: true, type: true, participantId: true, accepted: true, notifications: true },
      where: { ownerId: userId }
    });
  }

  public async getUserConversation(userId: number, conversationId: number, exceptionOnNotFound = false) {
    const conv = await this.userConversations.findOne({
      select: { id: true, type: true, participantId: true, accepted: true, notifications: true },
      where: { ownerId: userId, id: conversationId }
    });
    if (!conv && exceptionOnNotFound) throw new NotFoundException('Conversation not found');
    return conv;
  }



  public async createDirectConversation(callerId: number, participantId: number) {
    // Checks
    const [sameConversationId, participantExists] = await Promise.all([
      this.userConversations.findOne({
        select: { id: true },
        where: { ownerId: callerId, participantId: participantId, type: ConversationType.Direct }
      }),
      this.usersService.getProfileExists(participantId),
    ]);

    if (sameConversationId !== null)
      throw new ConflictException('A direct conversation between you and the given participant already exists');
    if (!participantExists)
      throw new NotFoundException('Participant user not found');

    // Data operations
    this.dataSource.manager.transaction(async manager => {
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

      return await this.getUserConversation(callerId, conversation.id, true);
    });

  }

  public async createGroupConversation() {  // TODO: implement after Groups are ready on DB

  }

  public async acceptConversation(callerId: number, conversationId: number) {
    await this.participations.update(
      { userId: callerId, conversationId: conversationId },
      { accepted: true }
    );
  }
}
