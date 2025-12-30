import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { ContactsDomainService } from 'src/domain/contacts/contacts.service';
import { ConversationsDomainService } from 'src/domain/conversations/conversations.service';
import { ConversationType } from 'src/domain/conversations/entities/conversation-type.enum';
import { ProfilesDomainService } from 'src/domain/profiles/profiles.service';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly conversations: ConversationsDomainService,
    private readonly profiles: ProfilesDomainService,
    private readonly contacts: ContactsDomainService,
  ) {}

  getUserConversations(userId: number) {
    return this.conversations.findUserConversations(userId);
  }

  async createConversation(callerId: number, type: ConversationType, participantId?: number) {
    if (type === ConversationType.Direct) {
      // validate participantId
      if (!participantId)
        throw new BadRequestException('participantId is required for direct conversations');
      if (participantId === callerId)
        throw new BadRequestException('partcipantId cannot be your own user ID');
      // assert participant exists
      await this.profiles.findRawProfile(participantId, true);

      // execute
      return await this.createDirectConversation(callerId, participantId);
    }
    // TODO: group conversation
    return undefined;
  }

  @Transactional()
  private async createDirectConversation(callerId: number, participantId: number) {
    // assert conversation does not already exist
    const existing = await this.conversations.findDirectConversationBetweenUsers(callerId, participantId);
    if (existing !== null) 
      throw new ConflictException('Direct conversation between these users already exists');

    // create conversation
    const conversation = await this.conversations.createDirectConversation(callerId, participantId);
    // create participations and contacts
    await Promise.all([
      this.conversations.createParticipation(callerId, conversation.id, true),
      this.conversations.createParticipation(participantId, conversation.id, false),
      this.contacts.createContact(callerId, participantId),
      this.contacts.createContact(participantId, callerId),
    ]);

    // return conversation
    return await this.conversations.findUserConversation(callerId, conversation.id, true);
  }

  async acceptConversation(callerId: number, conversationId: number) {
    return await this.conversations.acceptConversation(callerId, conversationId);
  }

  async deleteConversation(callerId: number, conversationId: number) {
    // assert conversation exists and user is a participant
    const conversation = await this.conversations.findUserConversation(callerId, conversationId, true);
    return await this.conversations.deleteConversation(conversationId);
  }
}
