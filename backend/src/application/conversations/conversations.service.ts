import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountsDomainService } from 'src/domain/accounts/accounts.service';
import { ContactsDomainService } from 'src/domain/contacts/contacts.service';
import { ConversationsDomainService } from 'src/domain/conversations/conversations.service';
import { ConversationType } from 'src/domain/conversations/entities/conversation-type.enum';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly conversations: ConversationsDomainService,
    private readonly contacts: ContactsDomainService,
    private readonly accounts: AccountsDomainService
  ) {}

  async getUserConversations(userId: number) {
    return await this.conversations.findUserConversations(userId);
  }

  async getConversationById(callerId: number, conversationId: number) {
    return await this.conversations.findUserConversation(callerId, conversationId, true);
  }
  

  async createConversation(callerId: number, type: ConversationType, participantId?: number) {
    if (type === ConversationType.DIRECT) {
      // check for stupid inputs
      if (!participantId)
        throw new BadRequestException('participantId is required for direct conversations');
      if (participantId === callerId)
        throw new BadRequestException('participantId cannot be your own user ID');

      // execute
      return await this.createDirectConversation(callerId, participantId);
    }
    return undefined;
  }

  @Transactional()
  private async createDirectConversation(callerId: number, participantId: number) {
    // assert participant exists and their account is activated
    const account = await this.accounts.findExistingById(participantId);
    if (!account.activated)
      throw new NotFoundException('not-found.user');  // treat deactivated accounts as non-existing

    // check if the conversation already exists
    const existing = await this.conversations.findDirectConversationBetweenUsers(callerId, participantId);
    if (existing !== null) 
      return existing;

    // create conversation
    const conversation = await this.conversations.createConversation(ConversationType.DIRECT);
    // create participations and contacts
    await Promise.all([
      this.conversations.createParticipation(callerId, conversation.id),
      this.conversations.createParticipation(participantId, conversation.id),
      this.contacts.createContact(callerId, participantId),
      this.contacts.createContact(participantId, callerId),
    ]);

    // return conversation
    return await this.conversations.findUserConversation(callerId, conversation.id, true);
  }
}
